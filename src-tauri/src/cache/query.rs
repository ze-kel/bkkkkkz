use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqliteRow;
use sqlx::Row;
use std::collections::HashMap;

use crate::schema::{default_book_schema, AttrValue, DateRead, SchemaItem};

use super::dbconn::get_db_conn;

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

pub async fn get_files_abstact(where_clause: String) -> Result<Vec<BookFromDb>, sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    let files_schema = default_book_schema();

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

    let res = sqlx::query(&q).fetch_all(&mut *db).await?;

    let result_iter: Vec<BookFromDb> = res
        .iter()
        .map(|row: &SqliteRow| {
            let mut hm: HashMap<String, AttrValue> = HashMap::new();

            for schema_i in files_schema.clone().iter() {
                let name = schema_i.name.to_owned();
                match schema_i.value {
                    crate::schema::AttrKey::Text => {
                        let v = row.get(&*name);
                        hm.insert(name, AttrValue::Text(v));
                    }
                    crate::schema::AttrKey::Number => {
                        let v = row.get(&*name);
                        hm.insert(name, AttrValue::Number(v));
                    }
                    crate::schema::AttrKey::NumberDecimal => {
                        let v = row.get(&*name);
                        hm.insert(name, AttrValue::NumberDecimal(v));
                    }
                    crate::schema::AttrKey::TextCollection => {
                        let v: String = row.get(&*name);
                        hm.insert(
                            name,
                            AttrValue::TextCollection(
                                v.split(",").map(|s| s.to_string()).collect(),
                            ),
                        );
                    }
                    crate::schema::AttrKey::DatesPairCollection => {
                        let v: String = row.get(&*name);
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

            BookFromDb {
                attrs: hm,
                path: Some(row.get("path")),
                modified: Some(row.get("modified")),
                ..Default::default()
            }
        })
        .collect();

    Ok(result_iter)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BookListGetResult {
    pub schema: Vec<SchemaItem>,
    pub books: Vec<BookFromDb>,
}

pub async fn get_files_by_path(path: String) -> Result<BookListGetResult, sqlx::Error> {
    let files = get_files_abstact(format!(
        "WHERE files.path LIKE concat('%', '{}', '%') GROUP BY files.path",
        path
    ))
    .await?;

    return Ok(BookListGetResult {
        schema: default_book_schema(),
        books: files,
    });
}

pub async fn get_all_tags() -> Result<Vec<String>, sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    let res = sqlx::query("SELECT DISTINCT value FROM tags")
        .fetch_all(&mut *db)
        .await?;

    let result: Vec<String> = res.iter().map(|r| r.get("value")).collect();

    Ok(result)
}

pub async fn get_all_folders() -> Result<Vec<String>, sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    let res = sqlx::query("SELECT DISTINCT path FROM folders")
        .fetch_all(&mut *db)
        .await?;

    let result: Vec<String> = res.iter().map(|r| r.get("path")).collect();

    Ok(result)
}
