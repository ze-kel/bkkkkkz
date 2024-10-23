mod errorhandling;
mod filewatcher;
mod metacache;
mod files;
use errorhandling::{send_err_to_frontend, ErrorFromRust};
use files::{read_file_by_path, save_file, FileReadMode};
use filewatcher::watch_path;
use metacache::{cache_files_and_folders, create_db_tables};
use tauri::AppHandle;

use std::thread;

mod db;
use db::{
    db_setup, get_all_folders, get_all_tags, get_files_by_path, get_files_by_tag, BookFromDb,
};

#[tauri::command]
fn c_setup_db() -> Result<(), String> {
    match db_setup() {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn c_prepare_cache(app: AppHandle, root_path: String) -> bool {
    match create_db_tables() {
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new("Error when creating tables in cache db".to_string(),
                format!("This should not happen. Try restarting the app, else report as bug\n\nRaw Error: {}", e.to_string()),)
                
            );
            return false;
        }
        Ok(_) => match cache_files_and_folders(&root_path) {
            Err(e) => {
                send_err_to_frontend(
                    &app,
                    &ErrorFromRust::new(
                    "Error when caching files".to_string(),
                    format!(
                        "These files will not be visible in app. \n\n Raw Error: {}",
                        e.join(",")
                    ))
                );
                return false;
            }
            Ok(_) => return true,
        },
    }
}

#[tauri::command]
fn c_start_watcher(app: AppHandle, root_path: String) {
    thread::spawn(move || watch_path(&root_path, app));
}

#[tauri::command]
fn c_get_files_path(app: AppHandle, path: String) -> Vec<BookFromDb> {
    return match get_files_by_path(path) {
        Ok(files) => files,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                "Error when getting files by path".to_string(),
                e.to_string()),
            );
            vec![]
        }
    };
}

#[tauri::command]
fn c_get_files_tag(app: AppHandle, tag: String) -> Vec<BookFromDb> {
    return match get_files_by_tag(tag) {
        Ok(files) => files,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                "Error when getting files by tag".to_string(),
                e.to_string()),
            );
            vec![]
        }
    };
}

#[tauri::command]
fn c_get_all_tags(app: AppHandle) -> Vec<String> {
    return match get_all_tags() {
        Ok(r) => r,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                "Error when getting all tags".to_string(),
                e.to_string()),
            );
            vec![]
        }
    };
}

#[tauri::command]
fn c_get_all_folders(app: AppHandle) -> Vec<String> {
    return match get_all_folders() {
        Ok(r) => r,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                "Error when getting folder tree".to_string(),
                e.to_string()),
            );
            vec![]
        }
    };
}

#[tauri::command]
fn c_read_file_by_path(_: AppHandle, path: String) -> Result<BookFromDb, String> {
     match read_file_by_path(&path, FileReadMode::FullFile) {
        Ok(v) => Ok(v),
        Err(e) =>  Err(e) 
    }
}


#[tauri::command]
fn c_save_file(_: AppHandle, book: BookFromDb) -> Result<String, String> {
     match save_file(book) {
        Ok(r) => Ok(r),
        Err(e) =>  Err(e) 
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
            c_get_all_folders,
            c_read_file_by_path,
            c_save_file
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
