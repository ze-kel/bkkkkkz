mod filewatcher;
mod metacache;
use filewatcher::watch_path;
use metacache::{cache_files_and_folders, create_db_tables};
use tauri::AppHandle;

use std::thread;

mod db;
use db::{db_setup, get_all_tags, get_files_by_path, get_files_by_tag, BookFromDb};

#[tauri::command]
fn c_setup_db() -> Result<(), String> {
    match db_setup() {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn c_prepare_cache(_: AppHandle, root_path: String) -> Result<(), String> {
    let tables = create_db_tables();

    if let Err(e) = tables {
        return Err(e.to_string());
    }

    cache_files_and_folders(&root_path).expect("Err when cache all files");
    Ok(())
}

#[tauri::command]
fn c_start_watcher(app: AppHandle, root_path: String) {
    thread::spawn(move || {
        watch_path(&root_path, app);
    });
}

#[tauri::command]
fn c_get_files_path(_: AppHandle, path: String) -> Result<Vec<BookFromDb>, String> {
    Ok(get_files_by_path(path).expect("error when get files"))
}

#[tauri::command]
fn c_get_files_tag(_: AppHandle, tag: String) -> Result<Vec<BookFromDb>, String> {
    Ok(get_files_by_tag(tag).expect("error when get files"))
}

#[tauri::command]
fn c_get_all_tags() -> Result<Vec<String>, String> {
    match get_all_tags() {
        Ok(tags) => Ok(tags),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            c_setup_db,
            c_prepare_cache,
            c_start_watcher,
            c_get_files_path,
            c_get_files_tag,
            c_get_all_tags,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
