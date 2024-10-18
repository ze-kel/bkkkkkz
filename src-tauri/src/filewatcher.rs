use notify::event::{CreateKind, ModifyKind, RemoveKind, RenameMode};
use notify::{Config, EventKind, RecursiveMode, Result, Watcher};
use notify::{Event, RecommendedWatcher};
use std::ffi::OsStr;
use std::path::Path;
use std::sync::mpsc::{channel, Receiver};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::errorhandling::{send_err_to_frontend, ErrorFromRust};
use crate::metacache::{
    cache_file, cache_files_and_folders, cache_folder, remove_file_from_cache,
    remove_files_in_folder_rom_cache, remove_folder_from_cache,
};

pub fn watch_path(path: &str, app: AppHandle) {
    let (tx, rx) = channel();

    let wr: Result<RecommendedWatcher> = Watcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(2)),
    );

    match wr {
        Ok(mut www) => match www.watch(Path::new(path), RecursiveMode::Recursive) {
            Ok(_) => {
                thread::spawn(move || {
                    handle_events(rx, app);
                });

                loop {
                    thread::park();
                }
            }
            Err(e) => {
                send_err_to_frontend(
                    &app,
                    &ErrorFromRust::new(
                       "Error: watcher process stopped".to_string(),
                       format!(
                        "Without watcher process app will not be able to process changes \n\nRaw Error: {}", e.to_string()
                    )
                    ).action("c_start_watcher".to_string(), "Restart watcher".to_string()),
                );
            }
        },
        Err(e) => send_err_to_frontend(
            &app,
            &ErrorFromRust::new(
                "Error: watcher process unable to initialize".to_string(),
                format!(
                 "Without watcher process app will not be able to process changes \n\nRaw Error: {}", e.to_string()
             )
             ).action("c_start_watcher".to_string(), "Restart watcher".to_string())
        ),
    }
}

pub fn handle_events(rx: Receiver<notify::Result<notify::Event>>, app: AppHandle) {
    loop {
        match rx.recv() {
            Ok(Ok(event)) => handle_event(event, &app),
            Ok(Err(e)) => println!("Error while processing event: {:?}", e),
            Err(e) => {
                println!("Watch error: {:?}", e);
                break;
            }
        }
    }
}

fn send_generic_watch_process_err(app: &AppHandle, place: String, raw_err_string: String) {
    send_err_to_frontend(
        app,
        &ErrorFromRust::new(
            "Watcher encountered an error".to_string(),
            format!("Location: {} \n\nRawError: {}", place, raw_err_string),
        ),
    );
}

fn handle_file_remove(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        match remove_file_from_cache(path) {
            Ok(_) => app.emit("file_remove", path.to_string_lossy()).unwrap(),
            Err(e) => send_generic_watch_process_err(
                app,
                format!("file_remove {}", path.to_string_lossy()),
                e.to_string(),
            ),
        };
    }
}

fn handle_file_add(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        match cache_file(path) {
            Ok(v) => app.emit("file_add", v).unwrap(),
            Err(e) => send_generic_watch_process_err(
                app,
                format!("file_add {}", path.to_string_lossy()),
                e.to_string(),
            ),
        }
    }
}

fn handle_file_update(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        match cache_file(path) {
            Ok(v) => app.emit("file_update", v).unwrap(),
            Err(e) => send_generic_watch_process_err(
                app,
                format!("file_update {}", path.to_string_lossy()),
                e.to_string(),
            ),
        }
    }
}

// Folder remove and folder add are called only for exact folder that was modified.
// This means that renaming folder -> folder_renamed will cause events for sub folders and sub files
// Therefore we need to remove\add all files in that directory
fn handle_folder_remove(app: &AppHandle, path: &Path) {
    match remove_folder_from_cache(path) {
        Err(e) => send_generic_watch_process_err(
            app,
            format!("folder_remove {}", path.to_string_lossy()),
            e.to_string(),
        ),
        Ok(_) => match remove_files_in_folder_rom_cache(path) {
            Err(e) => send_generic_watch_process_err(
                app,
                format!("folder_remove {}", path.to_string_lossy()),
                e.to_string(),
            ),
            Ok(_) => app.emit("folder_remove", path.to_string_lossy()).unwrap(),
        },
    };
}

fn handle_folder_add(app: &AppHandle, path: &Path) {
    match cache_folder(path) {
        Err(e) => send_generic_watch_process_err(
            app,
            format!("folder_remove {}", path.to_string_lossy()),
            e.to_string(),
        ),
        Ok(_) => match cache_files_and_folders(path) {
            Err(e) => send_generic_watch_process_err(
                app,
                format!("folder_remove {}", path.to_string_lossy()),
                e.join(","),
            ),
            Ok(_) => app.emit("folder_add", path.to_string_lossy()).unwrap(),
        },
    };
}

fn handle_event(event: Event, app: &AppHandle) {
    println!("{:?}", event);
    for (index, path) in event.paths.iter().enumerate() {
        match event.kind {
            EventKind::Create(kind) => match (kind, path.extension()) {
                (CreateKind::File, Some(ext)) => handle_file_add(app, &path, ext),
                (CreateKind::Folder, _) => handle_folder_add(app, &path),
                k => {
                    println!("unknown create event {:?}", k)
                }
            },
            EventKind::Modify(kind) => match kind {
                ModifyKind::Name(rename_mode) => match (
                    rename_mode,
                    path.try_exists(),
                    path.extension(),
                    path.is_file(),
                    path.is_dir(),
                    index,
                ) {
                    (RenameMode::From, _, Some(ext), _, _, _) => handle_file_remove(app, path, ext),
                    (RenameMode::From, _, _, _, _, _) => handle_folder_remove(app, path),
                    (RenameMode::To, _, Some(ext), true, _, _) => handle_file_add(app, &path, ext),
                    (RenameMode::To, _, _, _, true, _) => handle_folder_add(app, &path),
                    (RenameMode::Both, _, Some(ext), _, _, 0) => {
                        handle_file_remove(app, &path, ext)
                    }
                    (RenameMode::Both, _, _, _, _, 0) => handle_folder_remove(app, &path),
                    (RenameMode::Both, _, Some(ext), true, _, 1) => {
                        handle_file_add(app, &path, ext)
                    }
                    (RenameMode::Both, _, _, _, true, 1) => handle_folder_add(app, &path),
                    // finder on mac call with RenameMode::Any
                    (_, Ok(false), None, _, _, _) => handle_folder_remove(app, &path),
                    (_, Ok(false), Some(ext), _, _, _) => handle_file_remove(app, &path, ext),
                    (_, Ok(true), None, _, true, _) => handle_folder_add(app, &path),
                    (_, Ok(true), Some(ext), true, _, _) => handle_file_add(app, &path, ext),
                    (a, b, c, d, e, f) => {
                        println!(
                            "unknown rename event {:?} {:?} {:?} {} {} {}",
                            a, b, c, d, e, f
                        )
                    }
                },
                // Data is always file
                ModifyKind::Data(_) => match path.extension() {
                    Some(ext) => handle_file_update(app, &path, ext),
                    _ => (),
                },
                _ => (),
            },
            EventKind::Remove(kind) => match (kind, path.extension()) {
                (RemoveKind::File, Some(ext)) => handle_file_remove(app, &path, ext),
                (RemoveKind::Folder, _) => handle_folder_remove(app, &path),
                _ => (),
            },
            _ => (),
        };
    }
}
