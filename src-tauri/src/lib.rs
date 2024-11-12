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
use schema::load_schemas_from_disk;
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
async fn c_init_once(app: AppHandle) -> Result<bool, ErrorFromRust> {
    match db_setup().await {
        Ok(_) => Ok(()),
        Err(e) => Err(ErrorFromRust::new("Error on db setup")
            .info("This is a critical error. Report bug")
            .raw(e)),
    }?;

    match init_watcher().await {
        Ok(_) => Ok(()),
        Err(e) => Err(ErrorFromRust::new("Error on watcher init.")
            .info("This is a critical error. Report bug")
            .raw(e)),
    }?;

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

    Ok(true)
}

#[tauri::command]
async fn c_prepare_cache(app: AppHandle, path: String) -> Result<bool, ErrorFromRust> {
    match create_db_tables().await {
        Err(e) => Err(ErrorFromRust::new("Error when creating tables in cache db")
            .info("This should not happen. Try restarting the app, else report as bug.")
            .raw(e)),
        Ok(_) => Ok(()),
    }?;

    load_schemas_from_disk(&path).await;

    match cache_files_and_folders(&path).await {
        Err(e) => {
            // We don't return error here because user can have a few problematic files, which is ok
            send_err_to_frontend(&app, &e);
        }
        Ok(_) => (),
    }

    return Ok(true);
}

#[tauri::command]
async fn c_watch_path(_: AppHandle, path: String) -> Result<bool, ErrorFromRust> {
    match watch_path(&path).await {
        Ok(_) => Ok(true),
        Err(e) => Err(ErrorFromRust::new("Error starting watcher")
            .info("Try restarting app")
            .raw(e)),
    }
}

#[tauri::command]
async fn c_get_files_path(_: AppHandle, path: String) -> Result<BookListGetResult, ErrorFromRust> {
    return match get_files_by_path(path).await {
        Ok(files) => Ok(files),
        Err(e) => Err(ErrorFromRust::new("Error when getting files by path").raw(e)),
    };
}

#[tauri::command]
async fn c_get_all_tags(_: AppHandle) -> Result<Vec<String>, ErrorFromRust> {
    return match get_all_tags().await {
        Ok(r) => Ok(r),
        Err(e) => Err(ErrorFromRust::new("Error when getting all tags").raw(e)),
    };
}

#[tauri::command]
async fn c_get_all_folders(_: AppHandle) -> Result<Vec<String>, ErrorFromRust> {
    return match get_all_folders().await {
        Ok(r) => Ok(r),
        Err(e) => return Err(ErrorFromRust::new("Error getting folder list").raw(e)),
    };
}

#[tauri::command]
fn c_read_file_by_path(_: AppHandle, path: String) -> Result<files::BookReadResult, ErrorFromRust> {
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
) -> Result<files::BookSaveResult, ErrorFromRust> {
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
            c_watch_path,
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
