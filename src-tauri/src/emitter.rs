use serde::Serialize;
use tauri::{Emitter, Manager};
use ts_rs::TS;

use crate::{
    cache::query::BookFromDb,
    utils::{errorhandling::ErrorFromRust, global_app::get_global_app},
    watcher::event_handler::FolderEventEmit,
};

#[derive(Serialize, TS, Clone)]
#[ts(export)]
#[ts(tag = "type", content = "data")]
#[serde(tag = "t", content = "c")]
pub enum IPCEmitEvent {
    FileRemove(String),
    FileAdd(BookFromDb),
    FileUpdate(BookFromDb),
    FolderRemove(FolderEventEmit),
    FolderAdd(FolderEventEmit),
    ErrorHappened(ErrorFromRust),
}

pub fn emit_event(data: IPCEmitEvent) {
    let app = get_global_app().lock().unwrap();
    let handle = app.app_handle();

    match data {
        IPCEmitEvent::FileRemove(v) => handle.emit("FileRemove", v).unwrap(),
        IPCEmitEvent::FileAdd(v) => handle.emit("FileAdd", v).unwrap(),
        IPCEmitEvent::FileUpdate(v) => handle.emit("FileUpdate", v).unwrap(),
        IPCEmitEvent::FolderRemove(v) => handle.emit("FolderRemove", v).unwrap(),
        IPCEmitEvent::FolderAdd(v) => handle.emit("FolderAdd", v).unwrap(),
        IPCEmitEvent::ErrorHappened(v) => handle.emit("ErrorHappened", v).unwrap(),
    };
}
