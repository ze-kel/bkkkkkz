use tauri_plugin_store::StoreExt;
mod metacache;
use rusqlite::Connection;
mod filewatcher;
use filewatcher::watch_path;
use metacache::{cache_all_files, setup_database};
use once_cell::sync::OnceCell;
use tauri::{AppHandle, Emitter, Manager};

use std::sync::Mutex;

static DB_CONNECTION: OnceCell<Mutex<Connection>> = OnceCell::new();
fn get_db_connection() -> &'static Mutex<Connection> {
    DB_CONNECTION.get().expect("Database not initialized")
}

fn db_setup() -> Result<(), rusqlite::Error> {
    let connection = Connection::open("../files.db")?;

    setup_database(&connection);

    DB_CONNECTION
        .set(Mutex::new(connection))
        .expect("Database already initialized");

    Ok(())
}

#[tauri::command]
fn c_setup_db() {
    db_setup().expect("Error setup db")
}

#[tauri::command]
fn c_prepare_cache(app: AppHandle) {
    let conn = get_db_connection();

    let store = app.app_handle().store("appData.bin");

    if let Some(ref val) = store.get("ROOT_PATH") {
        if let Some(ref root_path) = val.as_str() {
            cache_all_files(&root_path, conn).expect("Err when cache all files");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
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
        .invoke_handler(tauri::generate_handler![c_prepare_cache])
        .invoke_handler(tauri::generate_handler![c_setup_db])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
