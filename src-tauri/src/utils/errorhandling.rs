use tauri::{AppHandle, Emitter};

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ErrorFromRust {
    pub title: String,
    pub description: String,
    #[serde(rename = "actionInvoke")]
    pub action_invoke: Option<String>,
    #[serde(rename = "actionLabel")]
    pub action_label: Option<String>,
}

impl ErrorFromRust {
    pub fn new(title: String, descr: String) -> Self {
        ErrorFromRust {
            title: title,
            description: descr,
            action_invoke: None,
            action_label: None,
        }
    }
    pub fn action(mut self, c_name: String, label: String) -> Self {
        self.action_invoke = Some(c_name);
        self.action_label = Some(label);
        self
    }
}

pub fn send_err_to_frontend(app: &AppHandle, e: &ErrorFromRust) {
    app.emit("error_happened", e).expect("Error when send err");
}
