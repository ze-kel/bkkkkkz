mod cache;
mod files;
mod schema;
mod utils;
mod watcher;

use std::{path::PathBuf, time::Duration};

use cache::{
    dbconn::db_setup,
    query::{get_all_folders, get_all_tags, get_files_by_path, BookFromDb, BookListGetResult},
    tables::create_db_tables_for_all_schemas,
    write::cache_files_and_folders,
};
use files::{read_file_by_path, save_file, FileReadMode};
use schema::{
    defaults::get_default_schemas,
    operations::{load_schema, load_schemas_from_disk, save_schema, SchemaLoadList},
};
use schema::{defaults::DefaultSchema, types::Schema};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tokio::task;
use utils::{
    errorhandling::{send_err_to_frontend, ErrorFromRust},
    global_app::{get_root_path, init_global_app},
};
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
async fn c_prepare_cache(app: AppHandle) -> Result<bool, ErrorFromRust> {
    let rp = get_root_path()?;

    match create_db_tables_for_all_schemas().await {
        Err(e) => Err(ErrorFromRust::new("Error when creating tables in cache db")
            .info("This should not happen. Try restarting the app, else report as bug.")
            .raw(e)),
        Ok(_) => Ok(()),
    }?;

    match cache_files_and_folders(&rp).await {
        Err(e) => {
            // We don't return error here because user can have a few problematic files, which is ok
            send_err_to_frontend(&app, &e);
        }
        Ok(_) => (),
    }

    return Ok(true);
}

#[tauri::command]
async fn c_watch_path(_: AppHandle) -> Result<bool, ErrorFromRust> {
    let rp = get_root_path()?;
    watch_path(&rp)
        .await
        .map_err(|e| {
            ErrorFromRust::new("Error starting watcher")
                .info("Try restarting app")
                .raw(e)
        })
        .map(|_| true)
}

#[tauri::command]
async fn c_get_files_path(_: AppHandle, path: String) -> Result<BookListGetResult, ErrorFromRust> {
    get_files_by_path(path).await
}

#[tauri::command]
async fn c_get_all_tags(_: AppHandle) -> Result<Vec<String>, ErrorFromRust> {
    get_all_tags()
        .await
        .map_err(|e| ErrorFromRust::new("Error when getting all tags").raw(e))
}

#[tauri::command]
async fn c_get_all_folders(_: AppHandle, path: String) -> Result<Vec<String>, ErrorFromRust> {
    get_all_folders(&path).await
}

#[tauri::command]
async fn c_read_file_by_path(
    _: AppHandle,
    path: String,
) -> Result<files::BookReadResult, ErrorFromRust> {
    read_file_by_path(&path, FileReadMode::FullFile).await
}

#[tauri::command]
async fn c_load_schemas(_: AppHandle) -> Result<SchemaLoadList, ErrorFromRust> {
    load_schemas_from_disk().await
}

#[tauri::command]
async fn c_load_schema(_: AppHandle, path: String) -> Result<Schema, ErrorFromRust> {
    load_schema(PathBuf::from(path)).await
}

#[tauri::command]
async fn c_save_schema(
    _: AppHandle,
    path: String,
    schema: Schema,
) -> Result<Schema, ErrorFromRust> {
    save_schema(&path, schema).await
}

#[tauri::command]
fn c_get_default_schemas(_: AppHandle) -> Vec<DefaultSchema> {
    get_default_schemas()
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
            c_load_schemas,
            c_load_schema,
            c_save_schema,
            c_get_default_schemas,
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
                init_global_app(app.handle().clone());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
