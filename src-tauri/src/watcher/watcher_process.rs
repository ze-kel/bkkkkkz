use notify::RecommendedWatcher;
use notify::{Event, RecursiveMode, Watcher};
use std::path::Path;

use tokio::sync::{broadcast, Mutex, OnceCell};

static GLOBAL_WATCHER: OnceCell<Mutex<GlobalWatcher>> = OnceCell::const_new();

struct GlobalWatcher {
    watcher: RecommendedWatcher,
    sender: broadcast::Sender<Event>,
}

impl GlobalWatcher {
    fn new() -> notify::Result<Self> {
        let (sender, _) = broadcast::channel(16);
        let sender_clone = sender.clone();

        let watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
            if let Ok(event) = res {
                let _ = sender_clone.send(event);
            }
        })?;

        Ok(GlobalWatcher { watcher, sender })
    }
}

// Initialize the global watcher
pub async fn init_watcher() -> notify::Result<()> {
    GLOBAL_WATCHER
        .get_or_init(|| async {
            Mutex::new(GlobalWatcher::new().expect("Failed to create watcher"))
        })
        .await;
    Ok(())
}

pub async fn watch_path(path: &str) -> notify::Result<()> {
    let w = GLOBAL_WATCHER
        .get()
        .expect("watch_path call when watcher does not exist");

    let mut watcher = w.lock().await;

    return watcher
        .watcher
        .watch(Path::new(path), RecursiveMode::Recursive);
}

pub async fn subscribe_to_events() -> broadcast::Receiver<Event> {
    let w = GLOBAL_WATCHER
        .get()
        .expect("subscribe_to_events call when watcher does not exist");
    let watcher = w.lock().await;

    watcher.sender.subscribe()
}
