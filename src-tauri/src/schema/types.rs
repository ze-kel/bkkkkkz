use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use ts_rs::TS;

#[derive(Serialize, Deserialize, Clone, Hash, Debug, TS)]
#[ts(export)]
pub struct DateRead {
    pub started: Option<String>,
    pub finished: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum AttrValue {
    Text(String),
    TextCollection(Vec<String>),
    DatesPairCollection(Vec<DateRead>),
    Number(f64),
    Date(String),
    DateCollection(Vec<String>),
    Image(String),
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(tag = "type", content = "settings")]
pub enum SchemaAttrKey {
    Text(TextSettings),
    TextCollection(EmptySettings),
    Number(NumberSettings),
    Date(EmptySettings),
    DateCollection(EmptySettings),
    DatesPairCollection(EmptySettings),
    Image(EmptySettings),
}

/*
    These types are not needed in rust, but useful in typescript
    Typescript confuses types with common fields unless they have unuique identificator:
    The proper way in TS is extends, but rust has no inheritance and we rely on typegen
*/
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SettingsTypeText {
    Text,
}
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SettingsTypeNumber {
    Num,
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TextSettings {
    pub settings_type: SettingsTypeText,
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
            settings_type: SettingsTypeText::Text,
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
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct NumberSettings {
    pub settings_type: SettingsTypeNumber,

    pub size: Option<InputSize>,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub style: Option<NumberStyle>,
    pub decimal_places: Option<u8>,
}

impl Default for NumberSettings {
    fn default() -> NumberSettings {
        NumberSettings {
            settings_type: SettingsTypeNumber::Num,
            size: None,
            min: None,
            max: None,
            style: None,
            decimal_places: None,
        }
    }
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct EmptySettings {}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum InputSize {
    S,
    M,
    L,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TextFont {
    Serif,
    Sans,
}
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TextWeight {
    Light,
    Normal,
    Bold,
    Black,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum TextTheme {
    Hidden,
    Default,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum NumberStyle {
    Default,
    Stars,
    Slider,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SchemaItem {
    pub name: String,
    pub value: SchemaAttrKey,
}

pub type SchemaItems = Vec<SchemaItem>;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
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
