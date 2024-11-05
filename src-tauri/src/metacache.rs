use rusqlite::{params, Connection, Result};
use std::path::Path;
use std::usize;
use walkdir::WalkDir;

use crate::db::{get_db_connection, BookFromDb};
use crate::files::{read_file_by_path, FileReadMode};
use crate::schema::{get_schema, AttrValue};

// Function to create or open the SQLite database and set up the table
pub fn create_db_tables() -> Result<(), rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let files_schema = get_schema();

    db.execute_batch(
        "DROP TABLE IF EXISTS folders;
        CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT);",
    )?;

    let mut columns: Vec<String> = Vec::new();

    let mut side_tables: Vec<String> = Vec::new();
    let mut side_tables_names: Vec<String> = Vec::new();

    for schema_i in files_schema {
        let name = schema_i.name;
        match schema_i.value {
            crate::schema::AttrKey::Text => {
                columns.push(format!("{} TEXT", name));
            }

            crate::schema::AttrKey::Number => {
                columns.push(format!("{} INTEGER", name));
            }
            crate::schema::AttrKey::TextCollection => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, value TEXT, 
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES files (path) ON DELETE CASCADE);",
                    name
                ));
                side_tables_names.push(name);
            }
            crate::schema::AttrKey::DatesPairCollection => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, started TEXT, finished TEXT,
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES files (path) ON DELETE CASCADE);",
                    name
                ));
                side_tables_names.push(name);
            }
        }
    }

    let drops: Vec<String> = side_tables_names
        .iter()
        .map(|t_name| format!("DROP TABLE IF EXISTS {};", t_name))
        .collect();

    db.execute_batch(&format!(
        "{}
        DROP TABLE IF EXISTS files;
        CREATE TABLE files (path TEXT PRIMARY KEY, modified TEXT, {});
        {}",
        drops.join(" "),
        columns.join(", "),
        side_tables.join(" "),
    ))
}

fn wrap_or_null(v: Option<String>) -> String {
    match v {
        None => "NULL".to_owned(),
        Some(v) => format!("\"{}\"", v),
    }
}

enum InsertValues {
    Text(String),
    Number(f64),
}

// Function to insert a file record into the database
pub fn insert_file(file: &BookFromDb) -> Result<(), rusqlite::Error> {
    let db: std::sync::MutexGuard<'_, Connection> = get_db_connection().lock().unwrap();

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

                separate_statements.push(format!(
                    "DELETE FROM tags WHERE path = '{}' AND ind >= {};",
                    path,
                    v.len(),
                ));

                if v.len() == 0 {
                    continue;
                }

                let pairs: Vec<String> = v
                    .iter()
                    .enumerate()
                    .map(|(ind, tag)| format!("({},\"{}\",\"{}\")", ind, path, tag))
                    .collect();

                separate_statements.push(format!(
                        "INSERT INTO tags(ind, path, value) VALUES {} ON CONFLICT(ind,path) DO UPDATE SET value=excluded.value",
                        pairs.join(",")
                    ));
            }
            crate::schema::AttrKey::DatesPairCollection => {
                let v = match file.attrs.get(&name) {
                    Some(v) => match v {
                        AttrValue::DatesPairCollection(v) => v,
                        _ => &Vec::new(),
                    },
                    None => &Vec::new(),
                };

                separate_statements.push(format!(
                    "DELETE FROM read WHERE path='{}' AND ind >= {};",
                    path,
                    v.len()
                ));

                if v.len() == 0 {
                    continue;
                }

                let pairs_insertion: Vec<String> = v
                    .iter()
                    .enumerate()
                    .map(|(ind, dates)| {
                        format!(
                            "({},\'{}\', {}, {})",
                            ind,
                            path,
                            wrap_or_null(dates.started.clone()),
                            wrap_or_null(dates.finished.clone())
                        )
                    })
                    .collect();

                let q_in = format!(
                    "INSERT INTO read(ind,path, started, finished) VALUES {} ON CONFLICT(ind,path) DO UPDATE SET started=excluded.started, finished=excluded.finished;",
                    pairs_insertion.join(",")
                );

                separate_statements.push(q_in);
            }
        }
    }

    let vals_as_text: Vec<String> = insert_values
        .iter()
        .map(|f| match f {
            InsertValues::Text(v) => format!("'{}'", v.replace("'", "\'")),
            InsertValues::Number(v) => format!("{}", v),
        })
        .collect();

    let vals_as_exclude: Vec<String> = insert_keys
        .iter()
        .map(|f| format!("{}=excluded.{}", f, f))
        .collect();

    let main_q = format!(
        "INSERT INTO files(path, modified, {})
        VALUES ('{}', '{}', {})
        ON CONFLICT(path) DO UPDATE SET
        modified=excluded.modified, {};",
        insert_keys.join(", "),
        path,
        file.modified.clone().unwrap_or(String::new()),
        vals_as_text.join(", "),
        vals_as_exclude.join(", ")
    );

    println!("{:?} {:?}", main_q, separate_statements);

    db.execute_batch(&main_q)?;
    db.execute_batch(&separate_statements.join(" "))?;

    Ok(())
}
pub fn cache_file(path: &Path) -> Result<BookFromDb, String> {
    match read_file_by_path(&path.to_string_lossy(), FileReadMode::OnlyMeta) {
        Ok(file) => match insert_file(&file.book) {
            Ok(_) => Ok(file.book),
            Err(e) => Err(format!("Error when caching file: {}", e.to_string())),
        },
        Err(e) => Err(format!("Error when reading file: {}", e)),
    }
}

pub fn remove_file_from_cache(path: &Path) -> Result<usize, rusqlite::Error> {
    let db: std::sync::MutexGuard<'_, Connection> = get_db_connection().lock().unwrap();
    db.execute(
        "DELETE FROM files WHERE path=?1",
        params![path.to_string_lossy().to_string()],
    )
}

pub struct CacheBatchErr {
    pub filename: String,
    pub error_text: String,
}

pub fn cache_files_and_folders<P: AsRef<Path>>(dir: P) -> Result<(), Vec<CacheBatchErr>> {
    let mut errs: Vec<CacheBatchErr> = vec![];

    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    match cache_file(&entry.path()) {
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
            match cache_folder(&entry.path()) {
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

pub fn cache_folder(path: &Path) -> Result<usize, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let folder_name = match path.file_name() {
        Some(s) => s.to_string_lossy().to_string(),
        // None is root path(technically it's also "some/folder/" but I assume this will never happen)
        None => "/".to_string(),
    };

    db.execute(
        "INSERT INTO folders(path, name)
        VALUES (?1, ?2)
        ON CONFLICT(path) DO UPDATE SET
        name=excluded.name;",
        (path.to_string_lossy().to_string(), folder_name),
    )
}

pub fn remove_folder_from_cache(path: &Path) -> Result<usize, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();
    db.execute(
        "DELETE FROM folders WHERE path LIKE concat(?1, '%')",
        params![path.to_string_lossy().to_string()],
    )
}

pub fn remove_files_in_folder_rom_cache(path: &Path) -> Result<usize, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();
    db.execute(
        "DELETE FROM files WHERE path LIKE concat(?1, '%')",
        params![path.to_string_lossy().to_string()],
    )
}
