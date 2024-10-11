use gray_matter::engine::YAML;
use gray_matter::Matter;
use rusqlite::{params, Connection, Result};
use serde::Deserialize;
use std::fs::File;
use std::io::{self, BufRead, BufReader};
use std::path::Path;
use std::sync::Mutex;
use walkdir::WalkDir;

// Function to create or open the SQLite database and set up the table
pub fn setup_database(conn: &Connection) -> Result<()> {
    println!("setup database call");
    let result = conn.execute_batch(
        "DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS files;
        DROP TABLE IF EXISTS read;
        CREATE TABLE files (path TEXT PRIMARY KEY, title TEXT, author TEXT, year INTEGER, myRating INTEGER, cover TEXT, isbn13 INTEGER);
        CREATE TABLE tags (id INTEGER PRIMARY KEY, path TEXT, tag TEXT, FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE);
        CREATE TABLE read (id INTEGER PRIMARY KEY, path TEXT, started TEXT, finished TEXT, FOREIGN KEY (path) REFERENCES files (path) ON DELETE CASCADE);",
    );

    println!("setup database end {}", result.is_err());
    Ok(())
}

fn wrap_or_null(v: Option<String>) -> String {
    match v {
        None => "NULL".to_owned(),
        Some(v) => format!("\"{}\"", v),
    }
}

// Function to insert a file record into the database
pub fn insert_file(conn: &Mutex<Connection>, path: &String, file: &BookData) -> Result<()> {
    let mut db = conn.lock().unwrap();

    db.execute(
        "INSERT INTO files(path, title, author, year, myRating, cover, isbn13)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ON CONFLICT(path) DO UPDATE SET
        title=excluded.title, author=excluded.author, year=excluded.year, myRating=excluded.myRating, cover=excluded.cover, isbn13=excluded.isbn13;",
        (path, file.title.clone(), file.author.clone(), file.year, file.myRating, file.cover.clone(), file.isbn13),
    )?;

    match &file.tags {
        None => db.execute("DELETE FROM tags WHERE path=$1", params![path])?,
        Some(t) => {
            db.execute(
                "DELETE FROM tags WHERE path=?1 AND tag NOT IN (?2)",
                (path, t.join(",")),
            )?;

            let pairs: Vec<String> = t
                .iter()
                .map(|tag| format!("(\"{}\",\"{}\")", path, tag))
                .collect();

            let q = format!("INSERT INTO tags(path, tag) VALUES {}", pairs.join(","));
            db.execute(&q, params!())?
        }
    };

    match &file.read {
        None => db.execute("DELETE FROM read WHERE path=$1", params![path])?,
        Some(t) => {
            let pairs_deletion: Vec<String> = t
                .iter()
                .map(|dates| {
                    format!(
                        "(started = {} AND finished ={})",
                        wrap_or_null(dates.started.clone()),
                        wrap_or_null(dates.finished.clone())
                    )
                })
                .collect();

            let q_del = format!(
                "DELETE FROM read WHERE path=\"{}\" AND NOT ({})",
                path,
                pairs_deletion.join(" OR ")
            );

            db.execute(&q_del, params!())?;

            let pairs_insertion: Vec<String> = t
                .iter()
                .map(|dates| {
                    format!(
                        "(\"{}\", {}, {})",
                        path,
                        wrap_or_null(dates.started.clone()),
                        wrap_or_null(dates.finished.clone())
                    )
                })
                .collect();

            let q_in = format!(
                "INSERT INTO read(path, started, finished) VALUES {}",
                pairs_insertion.join(",")
            );

            db.execute(&q_in, params!())?
        }
    };

    Ok(())
}

#[derive(Deserialize, Debug)]

pub struct DateRead {
    started: Option<String>,
    finished: Option<String>,
}

#[derive(Deserialize, Debug)]

pub struct BookData {
    title: Option<String>,
    author: Option<String>,
    year: Option<u16>,
    myRating: Option<u16>,
    read: Option<Vec<DateRead>>,
    tags: Option<Vec<String>>,
    cover: Option<String>,
    isbn13: Option<u64>,
}

pub fn cache_all_files<P: AsRef<Path>>(dir: P, conn: &Mutex<Connection>) -> Result<()> {
    let matter = Matter::<YAML>::new();
    for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "md" {
                    let path_str = entry.path().to_string_lossy().to_string();
                    if let Ok(Some(ref string_value)) = read_front_matter(&path_str) {
                        println!("{} {}", path_str, string_value);

                        let result = matter.parse(&string_value);

                        if let Some(ref data) = result.data {
                            let des: BookData = data.deserialize().unwrap();

                            insert_file(conn, &path_str, &des)?;
                        }

                        println!("{:?}", result.data);
                    }
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
