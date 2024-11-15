use std::{
    collections::HashMap,
    fs::{create_dir_all, read_dir, read_to_string, write},
    path::PathBuf,
    str,
    sync::Arc,
};

use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::utils::{errorhandling::ErrorFromRust, global_app::get_root_path};

use super::types::{Schema, SCHEMA_VERSION};

type GlobalSchema = Arc<Mutex<HashMap<String, Schema>>>;

// Static variable to hold our global state
static GLOBAL_STATE: OnceCell<GlobalSchema> = OnceCell::new();

fn get_gs() -> &'static GlobalSchema {
    GLOBAL_STATE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
}

pub async fn get_schema_cached_safe(path: &str) -> Result<Schema, ErrorFromRust> {
    let s = get_schema_cached(path).await;
    match s {
        Some(s) => Ok(s),
        None => Err(ErrorFromRust::new("Unable to retrieve schema")
            .info(
                "Unless you changed files manually this should not happen. Try restarting the app",
            )
            .raw(path)),
    }
}

pub async fn get_schema_path(path: &str) -> Option<String> {
    get_schema_cached(path).await.map(|v| v.internal_path)
}

pub async fn get_schema_cached(path: &str) -> Option<Schema> {
    let gs = get_gs().lock().await;

    for (key, value) in gs.iter() {
        if path.starts_with(key) {
            return Some(value.clone());
        }
    }

    return None;
}

pub async fn get_all_schemas_cached() -> Vec<Schema> {
    let gs = get_gs().lock().await;

    gs.iter()
        .filter_map(|(_, v)| match v.items.is_empty() {
            true => None,
            false => Some(v.clone()),
        })
        .collect()
}

pub async fn load_schema(path: PathBuf) -> Result<Schema, ErrorFromRust> {
    let mut schemas = get_gs().lock().await;

    let schema_path = path.join("schema.yaml");

    let file_content = read_to_string(schema_path)
        .map_err(|e| ErrorFromRust::new("Error when reading schema file").raw(e))?;

    let mut sch: Schema = serde_yml::from_str(&file_content)
        .map_err(|e| ErrorFromRust::new("Error parsing schema").raw(e))?;

    let folder_name = match path.file_name() {
        Some(v) => v,
        None => {
            return Err(
                ErrorFromRust::new("Unable to get basename from schema path").info(
                    "This is super unexpected, maybe you are using symlinks? Please report bug.",
                ),
            );
        }
    };
    sch.internal_name = folder_name.to_string_lossy().to_string();
    sch.internal_path = path.to_string_lossy().to_string();

    schemas.insert(path.to_string_lossy().to_string(), sch.clone());

    Ok(sch)
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SchemaLoadList {
    pub schemas: HashMap<String, Schema>,
    pub error: Option<ErrorFromRust>,
}

// Result err means that error was critical and nothing was parsed. Error inside of SchemaLoadList means a specific schema errored
pub async fn load_schemas_from_disk() -> Result<SchemaLoadList, ErrorFromRust> {
    let root = get_root_path()?;
    let rr = match read_dir(root) {
        Ok(v) => v,
        Err(e) => return Err(ErrorFromRust::new("Unable to read root folder").raw(e)),
    };

    let mut errors: Vec<ErrorFromRust> = Vec::new();

    for entry_option in rr {
        let entry = match entry_option {
            Ok(v) => v,
            Err(e) => {
                errors.push(ErrorFromRust::new("Error when reading folder contents").raw(e));
                continue;
            }
        };

        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(e) => {
                errors.push(ErrorFromRust::new("Error when reading metadata").raw(e));
                continue;
            }
        };

        if !metadata.is_dir() {
            continue;
        }

        match load_schema(entry.path()).await {
            Ok(_) => (),
            Err(e) => errors.push(e),
        }
    }

    let schemas = get_gs().lock().await;

    Ok(SchemaLoadList {
        schemas: schemas.clone(),
        error: match errors.len() {
            0 => None,
            _ => Some(
                ErrorFromRust::new("Encountered errors when parsing schemas in directory")
                    .subs(errors),
            ),
        },
    })
}

pub async fn save_schema(
    folder_path: &PathBuf,
    mut schema: Schema,
) -> Result<Schema, ErrorFromRust> {
    schema.version = SCHEMA_VERSION.to_string();
    let serialized = serde_yml::to_string(&schema)
        .map_err(|e| ErrorFromRust::new("Error serializing schema").raw(e))?;

    create_dir_all(folder_path).map_err(|e| {
        ErrorFromRust::new("Error creating directory")
            .info("Could not create schema folder")
            .raw(e)
    })?;

    let schema_path = folder_path.join("schema.yaml");

    write(schema_path, serialized).map_err(|e| {
        ErrorFromRust::new("Error writing to disk")
            .info("File was not saved")
            .raw(e)
    })?;

    let mut schemas = get_gs().lock().await;

    schemas.insert(folder_path.to_string_lossy().to_string(), schema.clone());

    Ok(schema)
}
