use gray_matter::engine::YAML;
use gray_matter::Matter;
use rusqlite::{params, Connection, Result};
use serde::Deserialize;
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;
use walkdir::WalkDir;

use crate::db::{get_db_connection, BookFromDb};

// Function to create or open the SQLite database and set up the table
pub fn create_db_tables() -> Result<(), rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();
    db.execute_batch(
        "DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS files;
        DROP TABLE IF EXISTS read;
        DROP TABLE IF EXISTS folders;
        CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT);
        CREATE TABLE files (path TEXT PRIMARY KEY, title TEXT, author TEXT, year INTEGER, myRating INTEGER, cover TEXT, isbn13 INTEGER);
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

    let path = file.path.as_ref().unwrap();

    db.execute(
        "INSERT INTO files(path, title, author, year, myRating, cover, isbn13)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ON CONFLICT(path) DO UPDATE SET
        title=excluded.title, author=excluded.author, year=excluded.year, myRating=excluded.myRating, cover=excluded.cover, isbn13=excluded.isbn13;",
        (file.path.clone(), file.title.clone(), file.author.clone(), file.year, file.myRating, file.cover.clone(), file.isbn13),
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
        None => {
            db.execute("DELETE FROM read WHERE path=$1", params![path])?;
        }
        Some(t) => {
            if (t.len() > 0) {
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
        }
    };

    Ok(())
}

#[derive(Deserialize, Debug, serde::Serialize, Clone)]
pub struct DateRead {
    pub started: Option<String>,
    pub finished: Option<String>,
}

fn get_file_by_path(path_str: &str) -> Result<BookFromDb, String> {
    let matter = Matter::<YAML>::new();
    let front_matter = read_front_matter(&path_str);
    let p = path_str.to_string();

    match front_matter {
        Ok(v) => match v {
            Some(text) => match matter.parse(&text).data {
                Some(data) => {
                    let mut des: BookFromDb = data.deserialize().unwrap();
                    des.path = Some(p);
                    Ok(des)
                }
                None => Ok(BookFromDb {
                    path: Some(p),
                    ..Default::default()
                }),
            },
            _ => Ok(BookFromDb {
                path: Some(p),
                ..Default::default()
            }),
        },
        Err(e) => return Err(format!("Error when parsing file: {}", e.to_string())),
    }
}

pub fn cache_file(path: &Path) -> Result<BookFromDb, String> {
    match get_file_by_path(&path.to_string_lossy()) {
        Ok(file) => match insert_file(&file) {
            Ok(f) => Ok(file),
            Err(e) => Err(format!("Error when caching file: {}", e.to_string())),
        },
        Err(e) => Err(format!("Error when reading file: {}", e.to_string())),
    }
}

pub fn remove_file_from_cache(path: &Path) -> Result<usize, rusqlite::Error> {
    let db: std::sync::MutexGuard<'_, Connection> = get_db_connection().lock().unwrap();
    db.execute(
        "DELETE FROM files WHERE path=?1",
        params![path.to_string_lossy().to_string()],
    )
}

pub fn cache_files_and_folders<P: AsRef<Path>>(dir: P) -> Result<()> {
    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    cache_file(&entry.path());
                }
            }
        }
        if entry.file_type().is_dir() {
            cache_folder(&entry.path()).expect("folder insert fail");
        }
    }
    Ok(())
}

pub fn read_front_matter(file_path: &str) -> io::Result<Option<String>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);

    let mut front_matter = String::new();
    let mut inside_front_matter = false;

    for line in reader.lines() {
        let line = line?;

        if line.trim() == "---" {
            if inside_front_matter {
                front_matter.push_str(&line);
                front_matter.push('\n');
                return Ok(Some(front_matter));
            } else {
                front_matter.push_str(&line);
                front_matter.push('\n');
                inside_front_matter = true;
                continue;
            }
        }

        if inside_front_matter {
            front_matter.push_str(&line);
            front_matter.push('\n');
        }
    }

    Ok(None)
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
