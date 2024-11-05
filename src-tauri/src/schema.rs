use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Hash, Debug)]
pub struct DateRead {
    pub started: Option<String>,
    pub finished: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AttrValue {
    Text(String),
    TextCollection(Vec<String>),
    DatesPairCollection(Vec<DateRead>),
    Number(f64),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AttrKey {
    Text,
    Number,
    TextCollection,
    DatesPairCollection,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SchemaItem {
    pub name: String,
    pub value: AttrKey,
}

pub type Schema = Vec<SchemaItem>;

pub fn get_schema() -> Schema {
    let mut schema: Vec<SchemaItem> = Vec::new();

    schema.push(SchemaItem {
        name: "title".to_owned(),
        value: AttrKey::Text,
    });
    schema.push(SchemaItem {
        name: "author".to_owned(),
        value: AttrKey::Text,
    });
    schema.push(SchemaItem {
        name: "year".to_owned(),
        value: AttrKey::Number,
    });
    schema.push(SchemaItem {
        name: "myRating".to_owned(),
        value: AttrKey::Number,
    });
    schema.push(SchemaItem {
        name: "read".to_owned(),
        value: AttrKey::DatesPairCollection,
    });
    schema.push(SchemaItem {
        name: "tags".to_owned(),
        value: AttrKey::TextCollection,
    });
    schema.push(SchemaItem {
        name: "cover".to_owned(),
        value: AttrKey::Text,
    });
    schema.push(SchemaItem {
        name: "ISBN13".to_owned(),
        value: AttrKey::Number,
    });

    return schema;
}
