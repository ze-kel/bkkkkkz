use notify::event::AccessKind;
use notify::{Config, EventKind, RecursiveMode, Result, Watcher};
use notify::{Event, RecommendedWatcher};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver};
use std::thread;
use std::time::Duration;

use crate::metacache::{cache_file, remove_from_cache};

pub fn watch_path(path: &str) -> Result<()> {
    let (tx, rx) = channel();

    let mut watcher: RecommendedWatcher = Watcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(2)),
    )?;

    let path = Path::new(path);

    if let Err(e) = watcher.watch(path, RecursiveMode::Recursive) {
        eprintln!("Failed to start watching: {}", e);
        return Err(e);
    }

    println!("Watching for changes in: {}", path.display());

    thread::spawn(move || {
        handle_events(rx);
    });

    loop {
        thread::park();
    }
}

pub fn handle_events(rx: Receiver<notify::Result<notify::Event>>) {
    // Event loop to listen for file changes
    loop {
        match rx.recv() {
            Ok(Ok(event)) => handle_event(event),
            Ok(Err(e)) => println!("Error while processing event: {:?}", e),
            Err(e) => {
                println!("Watch error: {:?}", e);
                break;
            }
        }
    }
}

fn handle_event(event: Event) {
    for path in event.paths {
        let path_str = path.to_string_lossy();
        let event_type = match event.kind {
            EventKind::Create(_) => cache_file(path_str.to_string()),
            EventKind::Modify(_) => cache_file(path_str.to_string()),
            EventKind::Remove(_) => remove_from_cache(path_str.to_string()),
            _ => (),
        };

        println!("Event: {:?} on path: {:?}", event_type, path_str);
    }
}
