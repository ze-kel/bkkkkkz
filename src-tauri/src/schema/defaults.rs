use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::schema::types::{EmptySettings, NumberSettings, TextSettings};

use super::types::{
    InputSize, NumberStyle, SchemaAttrKey, SchemaItem, SchemaItems, TextFont, TextTheme, TextWeight,
};

pub fn default_book_schema() -> SchemaItems {
    vec![
        SchemaItem {
            name: "title".to_owned(),
            value: SchemaAttrKey::Text(TextSettings {
                size: Some(InputSize::L),
                font: Some(TextFont::Serif),
                is_multiline: Some(true),
                theme: Some(TextTheme::Hidden),
                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "author".to_owned(),
            value: SchemaAttrKey::Text(TextSettings {
                size: Some(InputSize::M),
                weight: Some(TextWeight::Bold),
                theme: Some(TextTheme::Hidden),
                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "year".to_owned(),
            value: SchemaAttrKey::Number(NumberSettings {
                size: Some(InputSize::S),
                min: Some(0.0),
                ..NumberSettings::default()
            }),
        },
        SchemaItem {
            name: "myRating".to_owned(),
            value: SchemaAttrKey::Number(NumberSettings {
                min: Some(0.0),
                max: Some(5.0),
                decimal_places: Some(1),
                style: Some(NumberStyle::Stars),
                ..NumberSettings::default()
            }),
        },
        SchemaItem {
            name: "read".to_owned(),
            value: SchemaAttrKey::DatesPairCollection(EmptySettings {}),
        },
        SchemaItem {
            name: "tags".to_owned(),
            value: SchemaAttrKey::TextCollection(EmptySettings {}),
        },
        SchemaItem {
            name: "cover".to_owned(),
            value: SchemaAttrKey::Image(EmptySettings {}),
        },
        SchemaItem {
            name: "ISBN13".to_owned(),
            value: SchemaAttrKey::Number(NumberSettings {
                size: Some(InputSize::S),
                min: Some(0.0),
                ..NumberSettings::default()
            }),
        },
    ]
}

pub fn default_movie_schema() -> SchemaItems {
    vec![
        SchemaItem {
            name: "title".to_owned(),
            value: SchemaAttrKey::Text(TextSettings {
                size: Some(InputSize::L),
                font: Some(TextFont::Serif),
                is_multiline: Some(true),
                theme: Some(TextTheme::Hidden),

                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "director".to_owned(),
            value: SchemaAttrKey::Text(TextSettings {
                size: Some(InputSize::M),
                weight: Some(TextWeight::Bold),
                theme: Some(TextTheme::Hidden),
                ..TextSettings::default()
            }),
        },
        SchemaItem {
            name: "premiere".to_owned(),
            value: SchemaAttrKey::Date(EmptySettings {}),
        },
        SchemaItem {
            name: "myRating".to_owned(),
            value: SchemaAttrKey::Number(NumberSettings {
                min: Some(0.0),
                max: Some(5.0),
                style: Some(NumberStyle::Slider),
                ..NumberSettings::default()
            }),
        },
        SchemaItem {
            name: "watched".to_owned(),
            value: SchemaAttrKey::DateCollection(EmptySettings {}),
        },
        SchemaItem {
            name: "tags".to_owned(),
            value: SchemaAttrKey::TextCollection(EmptySettings {}),
        },
        SchemaItem {
            name: "poster".to_owned(),
            value: SchemaAttrKey::Image(EmptySettings {}),
        },
    ]
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DefaultSchema {
    pub name: String,
    pub description: String,
    pub schema_items: SchemaItems,
}

pub fn get_default_schemas() -> Vec<DefaultSchema> {
    vec![
        DefaultSchema {
            name: "Empty".to_owned(),
            description: "Empty schema without any fields".to_owned(),
            schema_items: vec![],
        },
        DefaultSchema {
            name: "Books".to_owned(),
            description: "Default schema for books, inspired by Goodreads".to_owned(),
            schema_items: default_book_schema(),
        },
        DefaultSchema {
            name: "Movies".to_owned(),
            description: "Default schema for books, inspired by Letterboxd".to_owned(),
            schema_items: default_movie_schema(),
        },
    ]
}
