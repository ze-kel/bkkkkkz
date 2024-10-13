use notify::event::{CreateKind, ModifyKind, RemoveKind, RenameMode};
use notify::{Config, EventKind, RecursiveMode, Result, Watcher};
use notify::{Event, RecommendedWatcher};
use std::ffi::OsStr;
use std::path::Path;
use std::sync::mpsc::{channel, Receiver};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

use crate::metacache::{
    cache_file, cache_folder, remove_file_from_cache, remove_folder_from_cache,
};

pub fn watch_path(path: &str, app: AppHandle) -> Result<()> {
    let (tx, rx) = channel();

    let mut watcher: RecommendedWatcher = Watcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(2)),
    )?;

    let path = Path::new(path);

    if let Err(e) = watcher.watch(path, RecursiveMode::Recursive) {
        eprintln!("Failed to start watching: {}", e);
        return Err(e);
    }

    println!("Watching for changes in: {}", path.display());

    thread::spawn(move || {
        handle_events(rx, app);
    });

    loop {
        thread::park();
    }
}

pub fn handle_events(rx: Receiver<notify::Result<notify::Event>>, app: AppHandle) {
    // Event loop to listen for file changes
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

fn handle_file_remove(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        remove_file_from_cache(path);
        app.emit("file_remove", path.to_string_lossy()).unwrap()
    }
}

fn handle_file_add(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        let v = cache_file(path).unwrap();
        app.emit("file_add", v).unwrap()
    }
}

fn handle_file_update(app: &AppHandle, path: &Path, ext: &OsStr) {
    if ext == "md" {
        let v = cache_file(path).unwrap();
        app.emit("file_update", v).unwrap()
    }
}

fn handle_folder_remove(app: &AppHandle, path: &Path) {
    remove_folder_from_cache(path);
    app.emit("folder_remove", path.to_string_lossy()).unwrap();
}

fn handle_folder_add(app: &AppHandle, path: &Path) {
    cache_folder(path);
    app.emit("folder_add", path.to_string_lossy()).unwrap();
}

fn handle_event(event: Event, app: &AppHandle) {
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
