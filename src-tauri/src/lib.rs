mod utils;
mod filewatcher;
mod files;
mod schema;
mod cache;

use cache::{create_tables::create_db_tables, dbconn::db_setup, query::{get_all_folders, get_all_tags, get_files_by_path, BookFromDb, BookListGetResult}, write::cache_files_and_folders};
use utils::errorhandling::{send_err_to_frontend, ErrorFromRust};
use files::{read_file_by_path, save_file, FileReadMode};
use filewatcher::watch_path;
use tauri::AppHandle;


#[tauri::command]
async fn c_setup_db(app: AppHandle) -> bool {
    match db_setup().await {
        Ok(_) => true,
        Err(e) => {
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new(
                "Error when caching".to_string(),
                format!(
                    "These files/folders will not be visible in app. Raw Error:{}",  e.to_string()
                ))
            );
            false
        },
    }
}

#[tauri::command]
async fn c_prepare_cache(app: AppHandle, root_path: String) -> bool {
    match create_db_tables().await {
        Err(e) => {
            print!("ERROR WHEN CREATE DB TABLES {}", e.to_string());
            send_err_to_frontend(
                &app,
                &ErrorFromRust::new("Error when creating tables in cache db".to_string(),
                format!("This should not happen. Try restarting the app, else report as bug. Raw Error: {}", e.to_string()),)
                
            );
            return false;
        }
        Ok(_) => match cache_files_and_folders(&root_path).await {
            Err(e) => {
            let a: Vec<String> =  e.iter().map(|ee| format!("{}: {}", ee.filename, ee.error_text)).collect();
                send_err_to_frontend(
                    &app,
                    &ErrorFromRust::new(
                    "Error when caching".to_string(),
                    format!(
                        "These files/folders will not be visible in app. \n\n {}", 
                       a.join("\n"),
                    ))
                );
                return false;
            }
            Ok(_) => return true,
        },
    }
}

#[tauri::command]
fn c_start_watcher(app: AppHandle, root_path: String) -> bool {
    std::thread::spawn(move || watch_path(&root_path, app));

    return true
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
                e.to_string()),
            );
            BookListGetResult{
                books:    vec![],
                schema: vec![]
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
                &ErrorFromRust::new(
                "Error when getting all tags".to_string(),
                e.to_string()),
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
                &ErrorFromRust::new(
                "Error when getting folder tree".to_string(),
                e.to_string()),
            );
            vec![]
        }
    };
}

#[tauri::command]
fn c_read_file_by_path(_: AppHandle, path: String) -> Result<files::BookReadResult, String> {
     match read_file_by_path(&path, FileReadMode::FullFile) {
        Ok(v) => Ok(v),
        Err(e) =>  Err(e) 
    }
}


#[tauri::command]
fn c_save_file(_: AppHandle, book: BookFromDb, forced: bool) -> Result<files::BookSaveResult, String> {
     match save_file(book, forced) {
        Ok(r) => Ok(r),
        Err(e) =>  Err(e) 
    }
}

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
