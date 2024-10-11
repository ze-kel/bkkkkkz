use notify::RecommendedWatcher;
use notify::{Config, RecursiveMode, Result, Watcher};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver};
use std::thread;
use std::time::Duration;

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
            Ok(Ok(event)) => println!("File change detected: {:?}", event),
            Ok(Err(e)) => println!("Error while processing event: {:?}", e),
            Err(e) => {
                println!("Watch error: {:?}", e);
                break;
            }
        }
    }
}
