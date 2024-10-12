use gray_matter::engine::YAML;
use gray_matter::Matter;
use rusqlite::{params, Connection, Result};
use serde::Deserialize;
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;
use std::sync::Mutex;
use walkdir::WalkDir;

use crate::db::get_db_connection;

// Function to create or open the SQLite database and set up the table
pub fn create_db_tables() -> Result<()> {
    let db = get_db_connection().lock().unwrap();
    let result = db.execute_batch(
        "DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS files;
        DROP TABLE IF EXISTS read;
        CREATE TABLE files (path TEXT PRIMARY KEY, title TEXT, author TEXT, year INTEGER, myRating INTEGER, cover TEXT, isbn13 INTEGER);
        CREATE TABLE tags (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, tag TEXT, UNIQUE(ind,path) FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE);
        CREATE TABLE read (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, started TEXT, finished TEXT, UNIQUE(ind,path) FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE);",
    );

    Ok(())
}

fn wrap_or_null(v: Option<String>) -> String {
    match v {
        None => "NULL".to_owned(),
        Some(v) => format!("\"{}\"", v),
    }
}

// Function to insert a file record into the database
pub fn insert_file(path: &String, file: &BookData) -> Result<()> {
    let db: std::sync::MutexGuard<'_, Connection> = get_db_connection().lock().unwrap();

    db.execute(
        "INSERT INTO files(path, title, author, year, myRating, cover, isbn13)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ON CONFLICT(path) DO UPDATE SET
        title=excluded.title, author=excluded.author, year=excluded.year, myRating=excluded.myRating, cover=excluded.cover, isbn13=excluded.isbn13;",
        (path, file.title.clone(), file.author.clone(), file.year, file.myRating, file.cover.clone(), file.isbn13),
    ).expect("FILE INSERT BASE");

    match &file.tags {
        None => db.execute("DELETE FROM tags WHERE path=$1", params![path])?,
        Some(t) => {
            db.execute(
                "DELETE FROM tags WHERE path = ?1 AND ind > ?2",
                params![path, t.len() - 1],
            )
            .expect("TAGS DELETE");

            let pairs: Vec<String> = t
                .iter()
                .enumerate()
                .map(|(ind, tag)| format!("({},\"{}\",\"{}\")", ind, path, tag))
                .collect();

            let q = format!(
                "INSERT INTO tags(ind, path, tag) VALUES {} ON CONFLICT(ind,path) DO UPDATE SET tag=excluded.tag",
                pairs.join(",")
            );

            println!("{}", q);
            db.execute(&q, params!()).expect("TAGS INSERT")
        }
    };

    match &file.read {
        None => db.execute("DELETE FROM read WHERE path=$1", params![path])?,
        Some(t) => {
            db.execute(
                "DELETE FROM read WHERE path=?1 AND ind > ?2",
                (path, t.len() - 1),
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
            println!("{}", q_in);

            db.execute(&q_in, params!())?
        }
    };

    Ok(())
}

#[derive(Deserialize, Debug)]
#[derive(serde::Serialize)]
pub struct DateRead {
    pub started: Option<String>,
    pub finished: Option<String>,
}

#[derive(Deserialize, Debug)]

pub struct BookData {
    pub title: Option<String>,
    pub author: Option<String>,
    pub year: Option<u16>,
    pub myRating: Option<u16>,
    pub read: Option<Vec<DateRead>>,
    pub tags: Option<Vec<String>>,
    pub cover: Option<String>,
    pub isbn13: Option<u64>,
}

pub fn cache_file(path: String) {
    let matter = Matter::<YAML>::new();

    if let Ok(Some(ref string_value)) = read_front_matter(&path) {
        let result = matter.parse(&string_value);

        if let Some(ref data) = result.data {
            let des: BookData = data.deserialize().unwrap();

            insert_file(&path, &des);
        }

        println!("{:?}", result.data);
    }
}

pub fn remove_from_cache(path: String) {
    let db: std::sync::MutexGuard<'_, Connection> = get_db_connection().lock().unwrap();
    db.execute("DELETE FROM files WHERE path=?1", params![path]);
}

pub fn cache_all_files<P: AsRef<Path>>(dir: P) -> Result<()> {
    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    let path_str = entry.path().to_string_lossy().to_string();
                    cache_file(path_str);
                }
            }
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
                // End of front matter
                front_matter.push_str(&line);
                front_matter.push('\n');
                return Ok(Some(front_matter));
            } else {
                // Start of front matter
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

    Ok(None) // No front matter found
}
