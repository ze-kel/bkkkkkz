use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;

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
    Number(f64),
    Date(String),
    DateCollection(Vec<String>),
    Image(String),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "settings")]
pub enum AttrKey {
    Text(Option<TextSettings>),
    TextCollection(Option<EmptySettings>),
    Number(Option<NumberSettings>),
    Date(Option<EmptySettings>),
    DateCollection(Option<EmptySettings>),
    DatesPairCollection(Option<EmptySettings>),
    Image(Option<EmptySettings>),
}
#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextSettings {
    pub display_name: Option<String>,
    pub size: Option<InputSize>,
    pub font: Option<TextFont>,
    pub weight: Option<TextWeight>,
    pub theme: Option<TextTheme>,
    pub is_multiline: Option<bool>,
}
impl Default for TextSettings {
    fn default() -> TextSettings {
        TextSettings {
            display_name: None,
            size: None,
            font: None,
            weight: None,
            theme: None,
            is_multiline: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NumberSettings {
    pub size: Option<InputSize>,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub style: Option<NumberStyle>,
    pub decimal_places: Option<u8>,
}

impl Default for NumberSettings {
    fn default() -> NumberSettings {
        NumberSettings {
            size: None,
            min: None,
            max: None,
            style: None,
            decimal_places: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmptySettings {}

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
pub struct SchemaItem {
    pub name: String,
    pub value: AttrKey,
}

pub type SchemaItems = Vec<SchemaItem>;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Schema {
    pub name: String,
    pub version: String,

    pub icon: Option<String>,

    pub items: SchemaItems,

    pub internal_path: String,
    // This is used to prefix table names in cache db
    // Currently is equal to folder name, will need to be random when\if we support multiple folders
    // Can possibly be used for schema cache invalidation
    pub internal_name: String,
}

pub const SCHEMA_VERSION: &str = "1.0";
