use notify::RecommendedWatcher;
use notify::{Config, RecursiveMode, Result, Watcher};
use std::path::Path;
use std::time::Duration;
use tauri::AppHandle;
use tokio::sync::mpsc;
use tokio::task;

use crate::utils::errorhandling::{send_err_to_frontend, ErrorFromRust};

use super::event_handler::handle_event;

#[tokio::main]
pub async fn watch_path(path: &str, app: AppHandle) {
    let (tx, mut rx) = mpsc::channel(100);

    let wr: Result<RecommendedWatcher> = Watcher::new(
        move |res| {
            // Send the event through the async channel
            let _ = tx.blocking_send(res);
        },
        Config::default().with_poll_interval(Duration::from_secs(2)),
    );

    match wr {
        Ok(mut www) => match www.watch(Path::new(path), RecursiveMode::Recursive) {
            Ok(_) => {
                task::spawn(async move {
                    handle_events(&mut rx, app).await;
                });

                loop {
                    tokio::time::sleep(Duration::from_secs(60 * 60)).await;
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

pub async fn handle_events(rx: &mut mpsc::Receiver<notify::Result<notify::Event>>, app: AppHandle) {
    loop {
        match rx.recv().await {
            Some(Ok(event)) => handle_event(event, &app).await,
            Some(Err(e)) => println!("Error while processing event: {:?}", e),
            None => (),
        }
    }
}
