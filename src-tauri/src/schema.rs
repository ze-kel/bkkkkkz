use std::{
    collections::HashMap,
    fs::{read_dir, read_to_string, write},
    path::PathBuf,
    str,
    sync::Arc,
};

use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::utils::errorhandling::ErrorFromRust;

#[derive(Serialize, Deserialize, Clone, Hash, Debug)]
pub struct DateRead {
    pub started: Option<String>,
    pub finished: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AttrValue {
    Text(String),
    TextCollection(Vec<String>),
    DatesPairCollection(Vec<DateRead>),
    NumberDecimal(f64),
    Number(u64),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AttrKey {
    Text,
    Number,
    NumberDecimal,
    TextCollection,
    DatesPairCollection,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum InputSize {
    S,
    M,
    L,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum TextFont {
    Serif,
    Sans,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum TextWeight {
    Light,
    Normal,
    Bold,
    Black,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum TextTheme {
    Hidden,
    Default,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum NumberStyle {
    Default,
    Stars,
    Slider,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AttrSettings {
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    size: Option<InputSize>,

    #[serde(rename = "textFont")]
    text_font: Option<TextFont>,
    #[serde(rename = "textWeight")]
    text_weight: Option<TextWeight>,
    #[serde(rename = "textTheme")]
    text_theme: Option<TextTheme>,
    #[serde(rename = "textMultiline")]
    text_multiline: Option<bool>,

    #[serde(rename = "numberMin")]
    number_min: Option<f64>,
    #[serde(rename = "numberMax")]
    number_max: Option<f64>,
    #[serde(rename = "numberStyle")]
    number_style: Option<NumberStyle>,
}

impl Default for AttrSettings {
    fn default() -> AttrSettings {
        AttrSettings {
            size: None,
            text_font: None,
            text_weight: None,
            text_multiline: None,
            text_theme: None,
            display_name: None,
            number_min: None,
            number_max: None,
            number_style: None,
        }
    }
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SchemaItem {
    pub name: String,
    pub value: AttrKey,
    pub settings: AttrSettings,
}

pub type Schema = Vec<SchemaItem>;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SchemaFile {
    name: Option<String>,
    version: Option<String>,
    schema: Vec<SchemaItem>,
}

pub fn default_book_schema() -> Schema {
    let mut schema: Vec<SchemaItem> = Vec::new();

    schema.push(SchemaItem {
        name: "title".to_owned(),
        value: AttrKey::Text,
        settings: AttrSettings {
            size: Some(InputSize::L),
            text_font: Some(TextFont::Serif),
            text_multiline: Some(true),
            text_theme: Some(TextTheme::Hidden),

            ..AttrSettings::default()
        },
    });
    schema.push(SchemaItem {
        name: "author".to_owned(),
        value: AttrKey::Text,
        settings: AttrSettings {
            size: Some(InputSize::M),
            text_weight: Some(TextWeight::Bold),
            text_theme: Some(TextTheme::Hidden),

            ..AttrSettings::default()
        },
    });
    schema.push(SchemaItem {
        name: "year".to_owned(),
        value: AttrKey::Number,
        settings: AttrSettings {
            size: Some(InputSize::S),
            number_min: Some(0.0),
            ..AttrSettings::default()
        },
    });
    schema.push(SchemaItem {
        name: "myRating".to_owned(),
        value: AttrKey::NumberDecimal,
        settings: AttrSettings {
            number_min: Some(0.0),
            number_max: Some(5.0),
            number_style: Some(NumberStyle::Stars),
            ..AttrSettings::default()
        },
    });
    schema.push(SchemaItem {
        name: "read".to_owned(),
        value: AttrKey::DatesPairCollection,
        settings: AttrSettings {
            ..AttrSettings::default()
        },
    });
    schema.push(SchemaItem {
        name: "tags".to_owned(),
        value: AttrKey::TextCollection,
        settings: AttrSettings {
            ..AttrSettings::default()
        },
    });
    schema.push(SchemaItem {
        name: "cover".to_owned(),
        value: AttrKey::Text,
        settings: AttrSettings {
            ..AttrSettings::default()
        },
    });
    schema.push(SchemaItem {
        name: "ISBN13".to_owned(),
        value: AttrKey::Number,
        settings: AttrSettings {
            ..AttrSettings::default()
        },
    });

    return schema;
}

type GlobalSchema = Arc<Mutex<HashMap<String, Schema>>>;

// Static variable to hold our global state
static GLOBAL_STATE: OnceCell<GlobalSchema> = OnceCell::new();

fn get_gs() -> &'static GlobalSchema {
    GLOBAL_STATE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
}

pub async fn get_schema_cached(path: &str) -> Result<Schema, ErrorFromRust> {
    let gs = get_gs().lock().await;

    for (key, value) in gs.iter() {
        if path.starts_with(key) {
            return Ok(value.to_vec());
        }
    }

    Err(ErrorFromRust::new("Unable to retrieve schema")
        .info("Unless you changed files manually this should not happen. Try restarting the app")
        .raw(path))
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SchemaLoadList {
    pub schemas: HashMap<String, Schema>,
    pub error: Option<ErrorFromRust>,
}

pub async fn load_schema(path: &str) -> Result<Schema, ErrorFromRust> {
    let mut schemas = get_gs().lock().await;

    let entry_path = PathBuf::from(path);
    let schema_path = entry_path.join("schema.yaml");

    let file_content = read_to_string(schema_path)
        .map_err(|e| ErrorFromRust::new("Error when reading file").raw(e))?;

    let sch: SchemaFile = serde_yml::from_str(&file_content)
        .map_err(|e| ErrorFromRust::new("Error parsing schema").raw(e))?;
    schemas.insert(entry_path.to_string_lossy().to_string(), sch.schema.clone());

    Ok(sch.schema)
}

// Result err means that error was critical and nothing was parsed. Error inside of SchemaLoadList means a specific schema errored
pub async fn load_schemas_from_disk(root: &str) -> Result<SchemaLoadList, ErrorFromRust> {
    let rr = match read_dir(root) {
        Ok(v) => v,
        Err(e) => return Err(ErrorFromRust::new("Unable to read root folder").raw(e)),
    };

    let mut errors: Vec<ErrorFromRust> = Vec::new();
    let mut schemas = get_gs().lock().await;

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

        let entry_path = entry.path();
        let schema_path = entry_path.join("schema.yaml");

        let file_content = match read_to_string(schema_path) {
            Ok(v) => v,
            Err(e) => {
                errors.push(ErrorFromRust::new("Error when reading file").raw(e));
                continue;
            }
        };

        let sch: SchemaFile = match serde_yml::from_str(&file_content) {
            Ok(v) => v,
            Err(e) => {
                errors.push(ErrorFromRust::new("Error parsing schema").raw(e));
                continue;
            }
        };
        schemas.insert(entry_path.to_string_lossy().to_string(), sch.schema);
    }

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

pub async fn save_schema(path: &str, schema: Schema) -> Result<(), ErrorFromRust> {
    let to_save = SchemaFile {
        name: Some("op_schema".to_string()),
        version: Some("1".to_string()),
        schema: schema,
    };

    let serialized = serde_yml::to_string(&to_save)
        .map_err(|e| ErrorFromRust::new("Error serializing schema").raw(e))?;

    write(path, serialized).map_err(|e| {
        ErrorFromRust::new("Error writing to disk")
            .info("File was not saved")
            .raw(e)
    })?;

    let mut schemas = get_gs().lock().await;

    schemas.insert(path.to_string(), to_save.schema);

    Ok(())
}
