use sqlx::{QueryBuilder, Sqlite};
use std::path::Path;
use walkdir::WalkDir;

use crate::files::{read_file_by_path, FileReadMode};
use crate::schema::operations::get_schema_cached_safe;
use crate::schema::types::{SchemaAttrKey, AttrValue};
use crate::utils::errorhandling::ErrorFromRust;

use super::dbconn::get_db_conn;
use super::query::BookFromDb;
use super::tables::get_table_names;

enum InsertValues {
    Text(String),
    Number(f64),
}

// Function to insert a file record into the database
pub async fn insert_file(file: &BookFromDb) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    let path = match file.path.as_ref() {
        Some(p) => p,
        None => return Ok(()),
    };

    let mut insert_keys: Vec<String> = Vec::new();
    let mut insert_values: Vec<InsertValues> = Vec::new();

    // Don't forget to add ";" at the end of statements you push here
    let mut separate_statements: Vec<QueryBuilder<'_, Sqlite>> = Vec::new();

    let files_schema = get_schema_cached_safe(&path).await?;
    let table_names = get_table_names(files_schema.internal_name);

    for schema_i in files_schema.items {
        let name = schema_i.name;
        match schema_i.value {
            SchemaAttrKey::Text(_) | SchemaAttrKey::Date(_) | SchemaAttrKey::Image(_) => {
                let v = match file.attrs.get(&name) {
                    Some(AttrValue::Text(v)) => v,
                    Some(AttrValue::Date(v)) => v,
                    Some(AttrValue::Image(v)) => v,
                    _ => "",
                };
                insert_keys.push(name);
                insert_values.push(InsertValues::Text(v.to_string()));
            }
            SchemaAttrKey::Number(_) => {
                let v = match file.attrs.get(&name) {
                    Some(AttrValue::Number(v)) => v.to_owned() as f64,
                    _ => 0.0,
                };

                insert_keys.push(name);
                insert_values.push(InsertValues::Number(v.to_owned()));
            }
            SchemaAttrKey::TextCollection(_) | SchemaAttrKey::DateCollection(_) => {
                let v = match file.attrs.get(&name) {
                    Some(AttrValue::TextCollection(v)) => v.clone(),
                    Some(AttrValue::DateCollection(v)) => v.clone(),
                    _ => Vec::new(),
                };

                let mut deletion: QueryBuilder<'_, Sqlite> = QueryBuilder::new(&format!(
                    "DELETE FROM {}{} WHERE path =",
                    table_names.table_prefix, name
                ));
                deletion
                    .push_bind(path)
                    .push(" AND ind >=")
                    .push_bind(v.len() as i64);
                separate_statements.push(deletion);

                if v.len() == 0 {
                    continue;
                }

                let mut insertion: QueryBuilder<'_, Sqlite> = QueryBuilder::new(&format!(
                    "INSERT INTO {}{} (ind, path, value) VALUES ",
                    table_names.table_prefix, name
                ));

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
                        .push_bind(value.clone())
                        .push(")");
                });
                insertion.push(" ON CONFLICT(ind,path) DO UPDATE SET value=excluded.value");
                separate_statements.push(insertion);
            }
            SchemaAttrKey::DatesPairCollection(_) => {
                let v = match file.attrs.get(&name) {
                    Some(AttrValue::DatesPairCollection(v)) => v,
                    _ => &Vec::new(),
                };

                let mut deletion: QueryBuilder<'_, Sqlite> = QueryBuilder::new(&format!(
                    "DELETE FROM {}{} WHERE path=",
                    table_names.table_prefix, name
                ));
                deletion
                    .push_bind(path)
                    .push(" AND ind >= ")
                    .push_bind(v.len() as i64);
                separate_statements.push(deletion);

                if v.len() == 0 {
                    continue;
                }

                let mut insertion: QueryBuilder<'_, Sqlite> = QueryBuilder::new(&format!(
                    "INSERT INTO {}{} (ind, path, started, finished) VALUES ",
                    table_names.table_prefix, name
                ));

                v.iter().enumerate().for_each(|(ind, value)| {
                    if ind > 0 {
                        insertion.push(",");
                    }
                    insertion
                        .push("(")
                        .push_bind(ind.clone() as i64)
                        .push(",")
                        .push_bind(path.clone())
                        .push(",")
                        .push_bind(value.started.clone())
                        .push(",")
                        .push_bind(value.finished.clone())
                        .push(")");
                });
                insertion.push(" ON CONFLICT(ind,path) DO UPDATE SET started=excluded.started, finished=excluded.finished");

                separate_statements.push(insertion);
            }
        }
    }

    let mut qb = QueryBuilder::new(&format!("INSERT INTO {}", table_names.files_table));
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

    qb.build().execute(&mut *db).await.map_err(|e| {
        ErrorFromRust::new("Error when saving file to cache")
            .info("Unless you changed schema files manually without app restart, this is likely a bug, please report it")
            .raw(e)
    })?;

    for mut qq in separate_statements {
        qq.build().execute(&mut *db).await.map_err(|e| {
            ErrorFromRust::new("Error when saving file to cache")
                .info("Unless you changed schema files manually without app restart, this is likely a bug, please report it")
                .raw(e)
        })?;
    }

    Ok(())
}

pub async fn cache_file(path: &Path) -> Result<BookFromDb, ErrorFromRust> {
    match read_file_by_path(&path.to_string_lossy(), FileReadMode::OnlyMeta).await {
        Ok(file) => insert_file(&file.book).await.map(|_| file.book),
        Err(e) => Err(e),
    }
}

pub async fn remove_file_from_cache(path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    let files_schema = get_schema_cached_safe(&path.to_string_lossy().to_string()).await?;
    let table_names = get_table_names(files_schema.internal_name);

    sqlx::query(&format!(
        "DELETE FROM {} WHERE path=?1",
        table_names.files_table
    ))
    .bind(path.to_string_lossy().to_string())
    .execute(&mut *db)
    .await
    .map_err(|e| ErrorFromRust::new("Error when removing file from cache").raw(e))?;

    Ok(())
}

pub async fn cache_files_and_folders<P: AsRef<Path>>(dir: P) -> Result<(), ErrorFromRust> {
    let mut err = ErrorFromRust::new("Error when caching files and folders");

    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    match cache_file(&entry.path()).await {
                        Ok(_) => (),
                        Err(e) => {
                            err = err.sub(e.info(&entry.file_name().to_string_lossy()));
                        }
                    }
                }
            }
        }
        if entry.file_type().is_dir() {
            match cache_folder(&entry.path()).await {
                Ok(_) => (),
                Err(e) => {
                    err = err.sub(e);
                }
            }
        }
    }
    Ok(())
}

pub async fn cache_folder(path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    let folder_name = match path.file_name() {
        Some(s) => s.to_string_lossy().to_string(),
        // None is root path(technically it's also "some/folder/" but I assume this will never happen)
        None => "/".to_string(),
    };

    let files_schema = get_schema_cached_safe(&path.to_string_lossy().to_string()).await?;
    let table_names = get_table_names(files_schema.internal_name);

    sqlx::query(
       &format!(
            "INSERT INTO {} (path, name) VALUES (?1, ?2) ON CONFLICT(path) DO UPDATE SET name=excluded.name",
           table_names.folders_table
        )
    )
    .bind(path.to_string_lossy().to_string())
    .bind(folder_name)
        .execute(&mut *db)
        .await
        .map_err(|e| ErrorFromRust::new("Error when caching folder").raw(e))?;

    Ok(())
}

pub async fn remove_folder_from_cache(path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    let files_schema = get_schema_cached_safe(&path.to_string_lossy().to_string()).await?;
    let table_names = get_table_names(files_schema.internal_name);

    sqlx::query(&format!(
        "DELETE FROM {} WHERE path LIKE concat(?1, '%')",
        table_names.folders_table
    ))
    .bind(path.to_string_lossy().to_string())
    .execute(&mut *db)
    .await
    .map_err(|e| ErrorFromRust::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}

pub async fn remove_files_in_folder_rom_cache(path: &Path) -> Result<(), ErrorFromRust> {
    let mut db = get_db_conn().lock().await;

    let files_schema = get_schema_cached_safe(&path.to_string_lossy().to_string()).await?;
    let table_names = get_table_names(files_schema.internal_name);

    sqlx::query(&format!(
        "DELETE FROM {} WHERE path LIKE concat(?1, '%')",
        table_names.files_table
    ))
    .bind(path.to_string_lossy().to_string())
    .execute(&mut *db)
    .await
    .map_err(|e| ErrorFromRust::new("Error when removing folder from cache").raw(e))?;

    Ok(())
}
