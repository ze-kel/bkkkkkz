use serde::{Deserialize, Serialize};

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
    Date(String),
    DateCollection(Vec<String>),
    Image(String),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AttrKey {
    Text,
    TextCollection,
    Number,
    NumberDecimal,
    Date,
    DateCollection,
    DatesPairCollection,
    Image,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<InputSize>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "textFont")]
    pub text_font: Option<TextFont>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "textWeight")]
    pub text_weight: Option<TextWeight>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "textTheme")]
    pub text_theme: Option<TextTheme>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "textMultiline")]
    pub text_multiline: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "numberMin")]
    pub number_min: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "numberMax")]
    pub number_max: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "numberStyle")]
    pub number_style: Option<NumberStyle>,
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

pub type SchemaItems = Vec<SchemaItem>;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Schema {
    pub name: String,
    pub version: String,

    pub items: SchemaItems,

    pub internal_path: String,
    // This is used to prefix table names in cache db
    // Currently is equal to folder name, will need to be random when\if we support multiple folders
    // Can possibly be used for schema cache invalidation
    pub internal_name: String,
}

pub const SCHEMA_VERSION: &str = "1.0";
