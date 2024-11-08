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

pub fn get_schema() -> Schema {
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
