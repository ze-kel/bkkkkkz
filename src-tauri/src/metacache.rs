use rusqlite::{params, Connection, Result};
use std::path::Path;
use std::usize;
use walkdir::WalkDir;

use crate::db::{get_db_connection, BookFromDb};
use crate::files::{read_file_by_path, FileReadMode};

// Function to create or open the SQLite database and set up the table
pub fn create_db_tables() -> Result<(), rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();
    db.execute_batch(
        "DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS files;
        DROP TABLE IF EXISTS read;
        DROP TABLE IF EXISTS folders;
        CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT);
        CREATE TABLE files (path TEXT PRIMARY KEY, modified TEXT, title TEXT, author TEXT, year INTEGER, myRating INTEGER, cover TEXT, isbn13 INTEGER);
        CREATE TABLE tags (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, tag TEXT, UNIQUE(ind,path) FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE);
        CREATE TABLE read (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, started TEXT, finished TEXT, UNIQUE(ind,path) FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE);")
}

fn wrap_or_null(v: Option<String>) -> String {
    match v {
        None => "NULL".to_owned(),
        Some(v) => format!("\"{}\"", v),
    }
}

// Function to insert a file record into the database
pub fn insert_file(file: &BookFromDb) -> Result<(), rusqlite::Error> {
    let db: std::sync::MutexGuard<'_, Connection> = get_db_connection().lock().unwrap();

    let path = match file.path.as_ref() {
        Some(p) => p,
        None => return Ok(()),
    };

    db.execute(
        "INSERT INTO files(path, modified, title, author, year, myRating, cover, isbn13)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ON CONFLICT(path) DO UPDATE SET
        modified=excluded.modified, title=excluded.title, author=excluded.author, year=excluded.year, myRating=excluded.myRating, cover=excluded.cover, isbn13=excluded.isbn13;",
        (file.path.clone(), file.modified.clone(), file.title.clone(), file.author.clone(), file.year, file.my_rating, file.cover.clone(), file.isbn13),
    )?;

    match &file.tags {
        None => db.execute("DELETE FROM tags WHERE path=$1", params![path])?,
        Some(t) => {
            db.execute(
                "DELETE FROM tags WHERE path = ?1 AND ind > ?2",
                params![file.path.clone(), t.len() - 1],
            )?;

            let pairs: Vec<String> = t
                .iter()
                .enumerate()
                .map(|(ind, tag)| format!("({},\"{}\",\"{}\")", ind, path, tag))
                .collect();

            let q = format!(
                "INSERT INTO tags(ind, path, tag) VALUES {} ON CONFLICT(ind,path) DO UPDATE SET tag=excluded.tag",
                pairs.join(",")
            );

            db.execute(&q, ())?
        }
    };

    match &file.read {
        None => db.execute("DELETE FROM read WHERE path=$1", params![path]),
        Some(t) => {
            if t.len() > 0 {
                db.execute(
                    "DELETE FROM read WHERE path=?1 AND ind > ?2",
                    (path.clone(), t.len() - 1),
                )?;

                let pairs_insertion: Vec<String> = t
                    .iter()
                    .enumerate()
                    .map(|(ind, dates)| {
                        format!(
                            "({},\"{}\", {}, {})",
                            ind,
                            path,
                            wrap_or_null(dates.started.clone()),
                            wrap_or_null(dates.finished.clone())
                        )
                    })
                    .collect();

                let q_in = format!(
                    "INSERT INTO read(ind,path, started, finished) VALUES {} ON CONFLICT(ind,path) DO UPDATE SET started=excluded.started, finished=excluded.finished",
                    pairs_insertion.join(",")

                );

                db.execute(&q_in, ())?;
            }
            return Ok(());
        }
    }?;

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

pub fn cache_files_and_folders<P: AsRef<Path>>(dir: P) -> Result<(), Vec<String>> {
    let mut errs: Vec<String> = vec![];

    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    match cache_file(&entry.path()) {
                        Ok(_) => (),
                        Err(e) => errs.push(e),
                    }
                }
            }
        }
        if entry.file_type().is_dir() {
            match cache_folder(&entry.path()) {
                Ok(_) => (),
                Err(e) => errs.push(e.to_string()),
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
