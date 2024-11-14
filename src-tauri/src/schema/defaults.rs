use serde::{Deserialize, Serialize};

use super::types::{
    AttrKey, AttrSettings, InputSize, NumberStyle, SchemaItem, SchemaItems, TextFont, TextTheme,
    TextWeight,
};

pub fn default_book_schema() -> SchemaItems {
    vec![
        SchemaItem {
            name: "title".to_owned(),
            value: AttrKey::Text,
            settings: AttrSettings {
                size: Some(InputSize::L),
                text_font: Some(TextFont::Serif),
                text_multiline: Some(true),
                text_theme: Some(TextTheme::Hidden),

                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "author".to_owned(),
            value: AttrKey::Text,
            settings: AttrSettings {
                size: Some(InputSize::M),
                text_weight: Some(TextWeight::Bold),
                text_theme: Some(TextTheme::Hidden),

                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "year".to_owned(),
            value: AttrKey::Number,
            settings: AttrSettings {
                size: Some(InputSize::S),
                number_min: Some(0.0),
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "myRating".to_owned(),
            value: AttrKey::NumberDecimal,
            settings: AttrSettings {
                number_min: Some(0.0),
                number_max: Some(5.0),
                number_style: Some(NumberStyle::Stars),
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "read".to_owned(),
            value: AttrKey::DatesPairCollection,
            settings: AttrSettings {
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "tags".to_owned(),
            value: AttrKey::TextCollection,
            settings: AttrSettings {
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "cover".to_owned(),
            value: AttrKey::Image,
            settings: AttrSettings {
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "ISBN13".to_owned(),
            value: AttrKey::Number,
            settings: AttrSettings {
                ..AttrSettings::default()
            },
        },
    ]
}

pub fn default_movie_schema() -> SchemaItems {
    vec![
        SchemaItem {
            name: "title".to_owned(),
            value: AttrKey::Text,
            settings: AttrSettings {
                size: Some(InputSize::L),
                text_font: Some(TextFont::Serif),
                text_multiline: Some(true),
                text_theme: Some(TextTheme::Hidden),

                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "director".to_owned(),
            value: AttrKey::Text,
            settings: AttrSettings {
                size: Some(InputSize::M),
                text_weight: Some(TextWeight::Bold),
                text_theme: Some(TextTheme::Hidden),
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "premiere".to_owned(),
            value: AttrKey::Date,
            settings: AttrSettings {
                size: Some(InputSize::S),
                number_min: Some(0.0),
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "myRating".to_owned(),
            value: AttrKey::NumberDecimal,
            settings: AttrSettings {
                number_min: Some(0.0),
                number_max: Some(5.0),
                number_style: Some(NumberStyle::Slider),
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "watched".to_owned(),
            value: AttrKey::DateCollection,
            settings: AttrSettings {
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "tags".to_owned(),
            value: AttrKey::TextCollection,
            settings: AttrSettings {
                ..AttrSettings::default()
            },
        },
        SchemaItem {
            name: "poster".to_owned(),
            value: AttrKey::Image,
            settings: AttrSettings {
                ..AttrSettings::default()
            },
        },
    ]
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DefaultSchema {
    pub name: String,
    pub description: String,
    pub schema_items: SchemaItems,
}

pub fn get_default_schemas() -> Vec<DefaultSchema> {
    vec![
        DefaultSchema {
            name: "books".to_owned(),
            description: "Default schema for books, inspired by Goodreads".to_owned(),
            schema_items: default_book_schema(),
        },
        DefaultSchema {
            name: "movies".to_owned(),
            description: "Default schema for books, inspired by Letterboxd".to_owned(),
            schema_items: default_movie_schema(),
        },
    ]
}
