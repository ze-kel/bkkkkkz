use notify::Error;
use once_cell::sync::OnceCell;
use rusqlite::Connection;

use std::{fmt::format, sync::Mutex};

use crate::metacache::{BookData, DateRead};

static DB_CONNECTION: OnceCell<Mutex<Connection>> = OnceCell::new();
pub fn get_db_connection() -> &'static Mutex<Connection> {
    DB_CONNECTION.get().expect("Database not initialized")
}

pub fn db_setup() -> Result<(), rusqlite::Error> {
    if DB_CONNECTION.get().is_some() {
        // Connection is already initialized, so we just return Ok.
        return Ok(());
    }

    let connection = Connection::open("../files.db")?;

    DB_CONNECTION
        .set(Mutex::new(connection))
        .expect("Database already initialized");

    Ok(())
}

#[derive(serde::Serialize)]
pub struct BookFromDb {
    pub path: String,
    pub title: Option<String>,
    pub author: Option<String>,
    pub year: Option<u16>,
    pub myRating: Option<u16>,
    pub read: Option<Vec<crate::metacache::DateRead>>,
    pub tags: Option<Vec<String>>,
    pub cover: Option<String>,
    pub isbn13: Option<u64>,
}

pub fn get_files_abstact(whereClause: String) -> Result<Vec<BookFromDb>, Error> {
    let db = get_db_connection().lock().unwrap();

    let q = format!("SELECT path, title, author, year, myRating, readRaw, tagsRaw, cover, isbn13 FROM files 
    LEFT JOIN 
    (SELECT tags.path as tagPath, GROUP_CONCAT(tags.tag, ',') AS tagsRaw FROM tags GROUP BY tags.path)
    ON files.path = tagPath
    LEFT JOIN 
    (SELECT read.path as readPath, GROUP_CONCAT(IFNULL(read.started,'') || '|' || IFNULL(read.finished,''), ',') as readRaw FROM read GROUP BY read.path)
    ON files.path = readPath {}", whereClause);

    let mut query = db.prepare(&q).unwrap();

    let result_iter = query
        .query_map([], |row| {
            let read_raw: String = row.get(5).expect("no read from db");
            let read: Vec<DateRead> = read_raw
                .split(',')
                .map(|dd| {
                    let mut parts = dd.split('|');
                    let started = parts.next().filter(|s| !s.is_empty()).map(String::from);
                    let finished = parts.next().filter(|f| !f.is_empty()).map(String::from);
                    DateRead {
                        started: started,
                        finished: finished,
                    }
                })
                .collect();

            let tags_raw: String = row.get(6).expect("no tags from db");
            let tags: Vec<String> = tags_raw.split(",").map(|s| s.to_string()).collect();

            Ok(BookFromDb {
                path: row.get(0).expect("No path from db"),
                title: row.get(1).expect("No title from db"),
                author: row.get(2).expect("No author from db"),
                year: row.get(3).expect("no year from db"),
                myRating: row.get(4).expect("no rating from db"),
                read: Some(read),
                tags: Some(tags),
                cover: row.get(7).expect("no cover from db"),
                isbn13: row.get(8).expect("no isbn from db"),
            })
        })
        .expect("Query error");

    let result: Vec<BookFromDb> = result_iter.filter_map(|p| p.ok()).collect();

    Ok(result)
}

pub fn get_files_by_path(path: String) -> Result<Vec<BookFromDb>, notify::Error> {
    get_files_abstact(format!(
        "WHERE files.path LIKE concat('%', '{}', '%') GROUP BY files.path",
        path
    ))
}

pub fn get_files_by_tag(tag: String) -> Result<Vec<BookFromDb>, notify::Error> {
    get_files_abstact(format!(
        "WHERE files.path IN (SELECT path FROM tags WHERE tag='{}')",
        tag
    ))
}

pub fn get_all_tags() -> Result<Vec<String>, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let mut q = db
        .prepare("SELECT DISTINCT tag FROM tags")
        .expect("fail to prepare sql");

    let result: Vec<String> = q
        .query_map((), |row| Ok(row.get(0).expect("empty tag")))
        .expect("query error")
        .filter_map(|t| t.ok())
        .collect();

    Ok(result)
}
