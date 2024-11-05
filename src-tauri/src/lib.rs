mod cache;
mod files;
mod schema;
mod utils;
mod watcher;

use std::time::Duration;

use cache::{
    create_tables::create_db_tables,
    dbconn::db_setup,
    query::{get_all_folders, get_all_tags, get_files_by_path, BookFromDb, BookListGetResult},
    write::cache_files_and_folders,
};
use files::{read_file_by_path, save_file, FileReadMode};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::task;
use utils::errorhandling::{send_err_to_frontend, ErrorFromRust};
use watcher::{
    events_process::{run_monitor, MonitorConfig},
    watcher_process::{init_watcher, subscribe_to_events, watch_path},
};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "value")]
enum ResultStringJson {
    Ok(String),
    Err(String),
}

#[tauri::command]
async fn c_init_once(app: AppHandle) -> bool {
    match db_setup().await {
        Ok(_) => (),
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                    "Error on init. This is a critical error. Report bug.".to_string(),
                    e.to_string(),
                ),
            );
            return false;
        }
    }

    match init_watcher().await {
        Ok(_) => (),
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                    "Error on init. This is a critical error. Report bug.".to_string(),
                    e.to_string(),
                ),
            );
            return false;
        }
    }

    task::spawn(async move {
        let event_rx = subscribe_to_events().await;

        run_monitor(
            event_rx,
            MonitorConfig {
                app: app.clone(),
                command_buffer_size: 32,
                log_to_stdout: true,
            },
        )
        .await;

        loop {
            tokio::time::sleep(Duration::from_secs(60 * 60)).await;
        }
    });

    true
}

#[tauri::command]
async fn c_prepare_cache(app: AppHandle, root_path: String) -> bool {
    match create_db_tables().await {
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new("Error when creating tables in cache db".to_string(),
                format!("This should not happen. Try restarting the app, else report as bug. Raw Error: {}", e.to_string()))
            );
            return false;
        }
        Ok(_) => (),
    }

    match cache_files_and_folders(&root_path).await {
        Err(e) => {
            let a: Vec<String> = e
                .iter()
                .map(|ee| format!("{}: {}", ee.filename, ee.error_text))
                .collect();
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                    "Error when caching".to_string(),
                    format!(
                        "These files/folders will not be visible in app. \n\n {}",
                        a.join("\n"),
                    ),
                ),
            );
            return false;
        }
        Ok(_) => (),
    }

    return true;
}

#[tauri::command]
async fn c_watch_paths(app: AppHandle, root_path: String) -> bool {
    match watch_path(&root_path).await {
        Ok(_) => (),
        Err(e) => send_err_to_frontend(
            &app,
            &ErrorFromRust::new("Error starting watcher".to_string(), e.to_string()),
        ),
    }
    return true;
}

#[tauri::command]
async fn c_get_files_path(app: AppHandle, path: String) -> BookListGetResult {
    return match get_files_by_path(path).await {
        Ok(files) => files,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                    "Error when getting files by path".to_string(),
                    e.to_string(),
                ),
            );
            BookListGetResult {
                books: vec![],
                schema: vec![],
            }
        }
    };
}

#[tauri::command]
async fn c_get_all_tags(app: AppHandle) -> Vec<String> {
    return match get_all_tags().await {
        Ok(r) => r,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new("Error when getting all tags".to_string(), e.to_string()),
            );
            vec![]
        }
    };
}

#[tauri::command]
async fn c_get_all_folders(app: AppHandle) -> Vec<String> {
    return match get_all_folders().await {
        Ok(r) => r,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new("Error when getting folder tree".to_string(), e.to_string()),
            );
            vec![]
        }
    };
}

#[tauri::command]
fn c_read_file_by_path(_: AppHandle, path: String) -> Result<files::BookReadResult, String> {
    match read_file_by_path(&path, FileReadMode::FullFile) {
        Ok(v) => Ok(v),
        Err(e) => Err(e),
    }
}

#[tauri::command]
fn c_save_file(
    _: AppHandle,
    book: BookFromDb,
    forced: bool,
) -> Result<files::BookSaveResult, String> {
    match save_file(book, forced) {
        Ok(r) => Ok(r),
        Err(e) => Err(e),
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            c_init_once,
            c_prepare_cache,
            c_watch_paths,
            c_get_files_path,
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
