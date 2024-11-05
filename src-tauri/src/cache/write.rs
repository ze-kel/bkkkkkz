use sqlx::{QueryBuilder, Sqlite};
use std::path::Path;
use walkdir::WalkDir;

use crate::files::{read_file_by_path, FileReadMode};
use crate::schema::{get_schema, AttrValue};

use super::dbconn::get_db_conn;
use super::query::BookFromDb;

enum InsertValues {
    Text(String),
    Number(f64),
}

// Function to insert a file record into the database
pub async fn insert_file(file: &BookFromDb) -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    let path = match file.path.as_ref() {
        Some(p) => p,
        None => return Ok(()),
    };

    let mut insert_keys: Vec<String> = Vec::new();
    let mut insert_values: Vec<InsertValues> = Vec::new();

    // Don't forget to add ";" at the end of statements you push here
    let mut separate_statements: Vec<String> = Vec::new();

    let files_schema = get_schema();

    for schema_i in files_schema {
        let name = schema_i.name;
        match schema_i.value {
            crate::schema::AttrKey::Text => {
                let v = match file.attrs.get(&name) {
                    Some(v) => match v {
                        AttrValue::Text(v) => v,
                        _ => "",
                    },
                    None => "",
                };
                insert_keys.push(name);
                insert_values.push(InsertValues::Text(v.to_string()));
            }
            crate::schema::AttrKey::Number => {
                let v = match file.attrs.get(&name).unwrap_or(&AttrValue::Number(0.0)) {
                    AttrValue::Number(v) => v,
                    _ => &0.0,
                };
                insert_keys.push(name);
                insert_values.push(InsertValues::Number(v.to_owned()));
            }
            crate::schema::AttrKey::TextCollection => {
                let v = match file.attrs.get(&name) {
                    Some(v) => match v {
                        AttrValue::TextCollection(v) => v,
                        _ => &Vec::new(),
                    },
                    None => &Vec::new(),
                };

                let mut deletion: QueryBuilder<'_, Sqlite> =
                    QueryBuilder::new("DELETE FROM tags WHERE path =");
                deletion
                    .push_bind(path)
                    .push("AND ind >=")
                    .push_bind(v.len() as i64);
                separate_statements.push(deletion.into_sql());

                if v.len() == 0 {
                    continue;
                }

                let mut insertion: QueryBuilder<'_, Sqlite> =
                    QueryBuilder::new("INSERT INTO tags(ind, path, value) VALUES");

                v.iter().enumerate().for_each(|(ind, value)| {
                    if ind > 0 {
                        insertion.push(",");
                    }
                    insertion
                        .push("(")
                        .push_bind(ind as i64)
                        .push(",")
                        .push_bind(path)
                        .push(",")
                        .push_bind(value)
                        .push(")");
                });
                insertion.push("ON CONFLICT(ind,path) DO UPDATE SET value=excluded.value");
                separate_statements.push(insertion.into_sql());
            }
            crate::schema::AttrKey::DatesPairCollection => {
                let v = match file.attrs.get(&name) {
                    Some(v) => match v {
                        AttrValue::DatesPairCollection(v) => v,
                        _ => &Vec::new(),
                    },
                    None => &Vec::new(),
                };

                let mut deletion: QueryBuilder<'_, Sqlite> =
                    QueryBuilder::new("DELETE FROM read WHERE path=");
                deletion
                    .push_bind(path)
                    .push("AND ind >=")
                    .push_bind(v.len() as i64);
                separate_statements.push(deletion.into_sql());

                if v.len() == 0 {
                    continue;
                }

                let mut insertion: QueryBuilder<'_, Sqlite> =
                    QueryBuilder::new("INSERT INTO read(ind,path, started, finished) VALUES");

                v.iter().enumerate().for_each(|(ind, value)| {
                    if ind > 0 {
                        insertion.push(",");
                    }
                    insertion
                        .push("(")
                        .push_bind(ind as i64)
                        .push(",")
                        .push_bind(path)
                        .push(",")
                        .push_bind(value.started.clone())
                        .push(",")
                        .push_bind(value.finished.clone())
                        .push(")");
                });
                insertion.push("ON CONFLICT(ind,path) DO UPDATE SET started=excluded.started, finished=excluded.finished");
                separate_statements.push(insertion.into_sql());
            }
        }
    }

    let mut qb = QueryBuilder::new("INSERT INTO files");
    qb.push("(path, modified");

    insert_keys.iter().for_each(|k| {
        qb.push(", ").push(k);
    });

    qb.push(") VALUES (");
    qb.push_bind(path)
        .push(", ")
        .push_bind(file.modified.clone());

    insert_values.iter().for_each(|k| {
        qb.push(", ").push_bind(match k {
            InsertValues::Text(v) => v.clone(),
            InsertValues::Number(v) => v.to_string(),
        });
    });

    qb.push(") ON CONFLICT(path) DO UPDATE SET modified=excluded.modified");

    insert_keys.iter().for_each(|k| {
        qb.push(", ").push(k).push("=excluded.").push(k);
    });

    match qb.build().execute(&mut *db).await {
        Ok(_) => (),
        Err(_) => {
            println!("\n Error on {}\n", qb.into_sql())
        }
    }

    for qq in separate_statements {
        match sqlx::query(&qq).execute(&mut *db).await {
            Ok(_) => (),
            Err(_) => {
                println!("\n Error on {}\n", qq)
            }
        }
    }

    Ok(())
}

pub async fn cache_file(path: &Path) -> Result<BookFromDb, String> {
    match read_file_by_path(&path.to_string_lossy(), FileReadMode::OnlyMeta) {
        Ok(file) => match insert_file(&file.book).await {
            Ok(_) => Ok(file.book),
            Err(e) => Err(format!("Error when caching file: {}", e.to_string())),
        },
        Err(e) => Err(format!("Error when reading file: {}", e)),
    }
}

pub async fn remove_file_from_cache(path: &Path) -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    sqlx::query("DELETE FROM files WHERE path=?1")
        .bind(path.to_string_lossy().to_string())
        .execute(&mut *db)
        .await?;

    Ok(())
}

pub struct CacheBatchErr {
    pub filename: String,
    pub error_text: String,
}

pub async fn cache_files_and_folders<P: AsRef<Path>>(dir: P) -> Result<(), Vec<CacheBatchErr>> {
    let mut errs: Vec<CacheBatchErr> = vec![];

    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    match cache_file(&entry.path()).await {
                        Ok(_) => (),
                        Err(e) => errs.push(CacheBatchErr {
                            error_text: e.to_string(),
                            filename: entry.file_name().to_string_lossy().to_string(),
                        }),
                    }
                }
            }
        }
        if entry.file_type().is_dir() {
            match cache_folder(&entry.path()).await {
                Ok(_) => (),
                Err(e) => errs.push(CacheBatchErr {
                    error_text: e.to_string(),
                    filename: entry.file_name().to_string_lossy().to_string(),
                }),
            }
        }
    }

    match errs.len() {
        0 => Ok(()),
        _ => Err(errs),
    }
}

pub async fn cache_folder(path: &Path) -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    let folder_name = match path.file_name() {
        Some(s) => s.to_string_lossy().to_string(),
        // None is root path(technically it's also "some/folder/" but I assume this will never happen)
        None => "/".to_string(),
    };

    sqlx::query(
        "INSERT INTO folders(path, name) VALUES (?1, ?2) ON CONFLICT(path) DO UPDATE SET name=excluded.name",
    )
    .bind(path.to_string_lossy().to_string()).bind(folder_name)
    .execute(&mut *db)
    .await?;

    Ok(())
}

pub async fn remove_folder_from_cache(path: &Path) -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    sqlx::query("DELETE FROM folders WHERE path LIKE concat(?1, '%')")
        .bind(path.to_string_lossy().to_string())
        .execute(&mut *db)
        .await?;

    Ok(())
}

pub async fn remove_files_in_folder_rom_cache(path: &Path) -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    sqlx::query("DELETE FROM files WHERE path LIKE concat(?1, '%')")
        .bind(path.to_string_lossy().to_string())
        .execute(&mut *db)
        .await?;

    Ok(())
}
