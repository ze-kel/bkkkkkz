use notify::RecommendedWatcher;
use notify::{Config, RecursiveMode, Result, Watcher};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver};
use std::thread;
use std::time::Duration;
use tauri_plugin_store::StoreExt;
mod metacache;
use rusqlite::Connection;

use metacache::{cache_all_files, setup_database};

fn watch_path(path: &str) -> Result<()> {
    // Create a channel to receive events
    let (tx, rx) = channel();

    // Configure the watcher
    let mut watcher: RecommendedWatcher = Watcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(2)),
    )?;

    // Convert the path to a Path object and start watching it
    let path = Path::new(path);
    watcher.watch(path, RecursiveMode::Recursive)?;

    println!("Watching for changes in: {}", path.display());

    // Spawn a thread to handle file change events
    thread::spawn(move || {
        handle_events(rx);
    });

    Ok(())
}

fn handle_events(rx: Receiver<notify::Result<notify::Event>>) {
    // Event loop to listen for file changes
    loop {
        match rx.recv() {
            Ok(Ok(event)) => println!("File change detected: {:?}", event),
            Ok(Err(e)) => println!("Error while processing event: {:?}", e),
            Err(e) => {
                println!("Watch error: {:?}", e);
                break;
            }
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

            let conn = Connection::open("./files.db")?;

            setup_database(&conn)?;

            let store = app.handle().store("appData.bin");

            if let Some(ref val) = store.get("ROOT_PATH") {
                if let Some(ref root_path) = val.as_str() {
                    cache_all_files(&root_path, &conn)?;
                    // let result = watch_path(&root_path);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
