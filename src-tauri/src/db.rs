use once_cell::sync::OnceCell;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

use std::{collections::HashMap, sync::Mutex};

use crate::schema::{get_schema, AttrValue, DateRead};

static DB_CONNECTION: OnceCell<Mutex<Connection>> = OnceCell::new();
pub fn get_db_connection() -> &'static Mutex<Connection> {
    DB_CONNECTION.get().expect("Database not initialized")
}

pub fn db_setup() -> Result<(), rusqlite::Error> {
    if DB_CONNECTION.get().is_some() {
        return Ok(());
    }
    let connection = Connection::open("../files.db")?;
    DB_CONNECTION
        .set(Mutex::new(connection))
        .expect("Database already initialized");
    Ok(())
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BookFromDb {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modified: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub markdown: Option<String>,

    pub attrs: HashMap<String, AttrValue>,
}

impl Default for BookFromDb {
    fn default() -> BookFromDb {
        BookFromDb {
            attrs: HashMap::new(),
            modified: None,
            path: None,
            markdown: None,
        }
    }
}

pub fn get_files_abstact(where_clause: String) -> Result<Vec<BookFromDb>, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let files_schema = get_schema();

    let mut joins: Vec<String> = Vec::new();
    let mut selects: Vec<String> = Vec::new();

    for schema_i in files_schema.clone() {
        match schema_i.value {
            crate::schema::AttrKey::TextCollection => {
                let name = schema_i.name.to_owned();
                selects.push(schema_i.name);
                joins.push(format!(
                    "LEFT JOIN
                    (SELECT {}.path as {}_path, GROUP_CONCAT({}.value, ',') 
                    AS {} FROM {} GROUP BY {}.path) 
                    ON files.path = {}_path",
                    name, name, name, name, name, name, name
                ));
            }
            crate::schema::AttrKey::DatesPairCollection => {
                let name = schema_i.name.to_owned();
                selects.push(schema_i.name);
                joins.push(format!(
                    "LEFT JOIN 
                    (SELECT {}.path as {}_path, 
                    GROUP_CONCAT(IFNULL({}.started,'') || '|' || IFNULL({}.finished,''), ',') 
                    AS {} FROM {} GROUP BY {}.path)
                    ON files.path = {}_path",
                    name, name, name, name, name, name, name, name,
                ));
            }
            _ => selects.push(schema_i.name),
        }
    }

    let q = format!(
        "SELECT path, modified, {} FROM files {} {}",
        selects.join(", "),
        joins.join(" "),
        where_clause
    );

    println!("\n{}\n", q);

    let mut query = db.prepare(&q)?;

    let result_iter = query.query_map([], |row| {
        let mut hm: HashMap<String, AttrValue> = HashMap::new();

        let index_offset = 2;

        for (i, schema_i) in files_schema.clone().into_iter().enumerate() {
            let name = schema_i.name.to_owned();
            match schema_i.value {
                crate::schema::AttrKey::Text => {
                    let v = row.get(i + index_offset).unwrap_or("".to_owned());
                    hm.insert(name, AttrValue::Text(v));
                }
                crate::schema::AttrKey::Number => {
                    let v = row.get(i + index_offset).unwrap_or(0.0);
                    hm.insert(name, AttrValue::Number(v));
                }
                crate::schema::AttrKey::TextCollection => {
                    let v = row.get(i + index_offset).unwrap_or("".to_owned());
                    hm.insert(
                        name,
                        AttrValue::TextCollection(v.split(",").map(|s| s.to_string()).collect()),
                    );
                }
                crate::schema::AttrKey::DatesPairCollection => {
                    let v = row.get(i + index_offset).unwrap_or("".to_owned());
                    hm.insert(
                        name,
                        AttrValue::DatesPairCollection(
                            v.split(',')
                                .map(|dd| {
                                    let mut parts = dd.split('|');
                                    DateRead {
                                        started: parts
                                            .next()
                                            .filter(|s| !s.is_empty())
                                            .map(String::from),
                                        finished: parts
                                            .next()
                                            .filter(|f| !f.is_empty())
                                            .map(String::from),
                                    }
                                })
                                .collect(),
                        ),
                    );
                }
            }
        }

        Ok(BookFromDb {
            attrs: hm,
            path: row.get(0).unwrap_or(None),
            modified: row.get(1).unwrap_or(None),
            ..Default::default()
        })
    })?;

    let result: Vec<BookFromDb> = result_iter.filter_map(|p| p.ok()).collect();

    Ok(result)
}

pub fn get_files_by_path(path: String) -> Result<Vec<BookFromDb>, rusqlite::Error> {
    get_files_abstact(format!(
        "WHERE files.path LIKE concat('%', '{}', '%') GROUP BY files.path",
        path
    ))
}

pub fn get_files_by_tag(tag: String) -> Result<Vec<BookFromDb>, rusqlite::Error> {
    get_files_abstact(format!(
        "WHERE files.path IN (SELECT path FROM tags WHERE value='{}')",
        tag
    ))
}

pub fn get_all_tags() -> Result<Vec<String>, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let mut q = db.prepare("SELECT DISTINCT tag FROM tags")?;

    let result: Vec<String> = q
        .query_map((), |row| Ok(row.get(0).expect("empty tag")))?
        .filter_map(|t| t.ok())
        .collect();

    Ok(result)
}

pub fn get_all_folders() -> Result<Vec<String>, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let mut q = db.prepare("SELECT DISTINCT path FROM folders")?;

    let result: Vec<String> = q
        .query_map((), |row| Ok(row.get(0).expect("empty tag")))?
        .filter_map(|t| t.ok())
        .collect();

    Ok(result)
}
