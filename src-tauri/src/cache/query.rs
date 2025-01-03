use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqliteRow;
use sqlx::Row;
use std::collections::HashMap;

use crate::schema::operations::get_schema_cached_safe;
use crate::schema::types::{AttrKey, AttrValue, DateRead, Schema};
use crate::utils::errorhandling::ErrorFromRust;

use super::dbconn::get_db_conn;
use super::tables::get_table_names;

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

pub async fn get_files_abstact(
    where_clause: String,
    schema: Schema,
) -> Result<Vec<BookFromDb>, ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    let t_info = get_table_names(schema.internal_name.clone());
    let files_table = t_info.files_table;
    let table_prefix = t_info.table_prefix;

    let mut joins: Vec<String> = Vec::new();
    let mut selects: Vec<String> = Vec::new();

    for schema_i in schema.items.clone() {
        let columm_name = schema_i.name.to_owned();
        let table_name = format!("{}{}", table_prefix, columm_name);
        match schema_i.value {
            AttrKey::TextCollection(_) | AttrKey::DateCollection(_) => {
                selects.push(columm_name.clone());
                joins.push(format!(
                    "LEFT JOIN
                    (SELECT {}.path as {}_path, GROUP_CONCAT({}.value, ',') 
                    AS {} FROM {} GROUP BY {}.path) 
                    ON {}.path = {}_path",
                    table_name,
                    columm_name,
                    table_name,
                    columm_name,
                    table_name,
                    table_name,
                    files_table,
                    columm_name
                ));
            }
            AttrKey::DatesPairCollection(_) => {
                selects.push(columm_name.clone());
                joins.push(format!(
                    "LEFT JOIN 
                    (SELECT {}.path as {}_path, 
                    GROUP_CONCAT(IFNULL({}.started,'') || '|' || IFNULL({}.finished,''), ',') 
                    AS {} FROM {} GROUP BY {}.path)
                    ON {}.path = {}_path",
                    table_name,
                    columm_name,
                    table_name,
                    table_name,
                    columm_name,
                    table_name,
                    table_name,
                    files_table,
                    columm_name,
                ));
            }
            AttrKey::Text(_) | AttrKey::Number(_) | AttrKey::Image(_) | AttrKey::Date(_) => {
                selects.push(columm_name)
            }
        }
    }

    let q = format!(
        "SELECT path, modified, {} FROM {} {} {}",
        selects.join(", "),
        files_table,
        joins.join(" "),
        where_clause
    );

    let res = sqlx::query(&q).fetch_all(&mut *db).await.map_err(|e| {
        ErrorFromRust::new("Error when getting files").raw(format!("{}\n\n{}", e.to_string(), q))
    })?;

    let result_iter: Vec<BookFromDb> = res
        .iter()
        .map(|row: &SqliteRow| {
            let mut hm: HashMap<String, AttrValue> = HashMap::new();

            for schema_i in schema.items.clone().iter() {
                let name = schema_i.name.to_owned();
                match schema_i.value {
                    AttrKey::Text(_) => {
                        let v = row.get(&*name);
                        hm.insert(name, AttrValue::Text(v));
                    }
                    AttrKey::Date(_) => {
                        let v = row.get(&*name);
                        hm.insert(name, AttrValue::Date(v));
                    }
                    AttrKey::Image(_) => {
                        let v = row.get(&*name);
                        hm.insert(name, AttrValue::Image(v));
                    }

                    AttrKey::Number(_) => {
                        let v = row.get(&*name);
                        hm.insert(name, AttrValue::Number(v));
                    }
                    AttrKey::TextCollection(_) => {
                        let v: String = row.get(&*name);
                        hm.insert(
                            name,
                            AttrValue::TextCollection(
                                v.split(",").map(|s| s.to_string()).collect(),
                            ),
                        );
                    }
                    AttrKey::DateCollection(_) => {
                        let v: String = row.get(&*name);
                        hm.insert(
                            name,
                            AttrValue::DateCollection(
                                v.split(",").map(|s| s.to_string()).collect(),
                            ),
                        );
                    }
                    AttrKey::DatesPairCollection(_) => {
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
    pub schema: Schema,
    pub books: Vec<BookFromDb>,
}

pub async fn get_files_by_path(path: String) -> Result<BookListGetResult, ErrorFromRust> {
    let schema = get_schema_cached_safe(&path).await?;

    let t_info = get_table_names(schema.internal_name.clone());

    let files = get_files_abstact(
        format!(
            "WHERE {}.path LIKE concat('%', '{}', '%') GROUP BY {}.path",
            t_info.files_table, path, t_info.files_table
        ),
        schema.clone(),
    )
    .await?;

    return Ok(BookListGetResult {
        schema: schema,
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

pub async fn get_all_folders(schema_path: &str) -> Result<Vec<String>, ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    let schema = get_schema_cached_safe(&schema_path).await?;

    let t_info = get_table_names(schema.internal_name.clone());

    let res = sqlx::query(&format!(
        "SELECT DISTINCT path FROM {}",
        t_info.folders_table
    ))
    .fetch_all(&mut *db)
    .await
    .map_err(|e| ErrorFromRust::new("Error getting folder list").raw(e))?;

    let result: Vec<String> = res.iter().map(|r| r.get("path")).collect();

    Ok(result)
}
