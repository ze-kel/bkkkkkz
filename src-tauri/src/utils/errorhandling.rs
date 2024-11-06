use tauri::{AppHandle, Emitter};

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub enum ErrorActionCode {
    FileSaveRetry,
    FileSaveRetryForced,
    FileReadRetry,
    InitOnceRetry,
    PrepareCacheRetry,
    WatchPathRetry,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ErrorFromRust {
    #[serde(rename = "isError")]
    pub is_error: bool,
    pub title: String,
    pub info: Option<String>,

    #[serde(rename = "rawError")]
    pub raw_error: Option<String>,
    #[serde(rename = "subErrors")]
    pub sub_errors: Vec<ErrorFromRust>,

    // Pass code for custom bind on frontend
    #[serde(rename = "actionCode")]
    pub action_code: Option<ErrorActionCode>,

    // Label for button that will call action
    #[serde(rename = "actionLabel")]
    pub action_label: Option<String>,
}

impl ErrorFromRust {
    pub fn new(title: &str) -> Self {
        ErrorFromRust {
            is_error: true,
            title: title.to_string(),
            sub_errors: vec![],
            raw_error: None,
            info: None,
            action_label: None,
            action_code: None,
        }
    }
    pub fn info(mut self, descrition: &str) -> Self {
        self.info = Some(descrition.to_string());
        self
    }

    pub fn action_c(mut self, code: ErrorActionCode, label: &str) -> Self {
        self.action_code = Some(code);
        self.action_label = Some(label.to_string());
        self
    }
    pub fn raw<T: ToString>(mut self, thing: T) -> Self {
        self.raw_error = Some(thing.to_string());
        self
    }
    pub fn sub(mut self, thing: ErrorFromRust) -> Self {
        self.sub_errors.push(thing);
        self
    }
}

// This will show a notification on frontend, regardless of what is opened. Prefer returning error from invoke if possible.
pub fn send_err_to_frontend(app: &AppHandle, e: &ErrorFromRust) {
    app.emit("error_happened", e).expect("Error when send err");
}
