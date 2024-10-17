use once_cell::sync::OnceCell;
use rusqlite::Connection;

use std::sync::Mutex;

use crate::metacache::DateRead;

static DB_CONNECTION: OnceCell<Mutex<Connection>> = OnceCell::new();
pub fn get_db_connection() -> &'static Mutex<Connection> {
    DB_CONNECTION.get().expect("Database not initialized")
}

pub fn db_setup() -> Result<(), rusqlite::Error> {
    if DB_CONNECTION.get().is_some() {
        return Ok(());
    }
    let connection = Connection::open("../files.db")?;
    DB_CONNECTION
        .set(Mutex::new(connection))
        .expect("Database already initialized");
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct BookFromDb {
    pub path: Option<String>,
    pub title: Option<String>,
    pub author: Option<String>,
    pub year: Option<u16>,
    pub myRating: Option<f64>,
    pub read: Option<Vec<crate::metacache::DateRead>>,
    pub tags: Option<Vec<String>>,
    pub cover: Option<String>,
    pub isbn13: Option<u64>,
}

impl Default for BookFromDb {
    fn default() -> BookFromDb {
        BookFromDb {
            path: None,
            title: None,
            author: None,
            year: None,
            myRating: None,
            read: None,
            tags: None,
            cover: None,
            isbn13: None,
        }
    }
}

pub fn get_files_abstact(where_clause: String) -> Result<Vec<BookFromDb>, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let q = format!("SELECT path, title, author, year, myRating, readRaw, tagsRaw, cover, isbn13 FROM files 
    LEFT JOIN 
    (SELECT tags.path as tagPath, GROUP_CONCAT(tags.tag, ',') AS tagsRaw FROM tags GROUP BY tags.path)
    ON files.path = tagPath
    LEFT JOIN 
    (SELECT read.path as readPath, GROUP_CONCAT(IFNULL(read.started,'') || '|' || IFNULL(read.finished,''), ',') as readRaw FROM read GROUP BY read.path)
    ON files.path = readPath {}", where_clause);

    let mut query = db.prepare(&q)?;

    let result_iter = query.query_map([], |row| {
        let reads_from_db: Result<String, rusqlite::Error> = row.get(6);
        let reads: Option<Vec<DateRead>> = match reads_from_db {
            Ok(v) => Some(
                v.split(',')
                    .map(|dd| {
                        let mut parts = dd.split('|');
                        let started = parts.next().filter(|s| !s.is_empty()).map(String::from);
                        let finished = parts.next().filter(|f| !f.is_empty()).map(String::from);
                        DateRead {
                            started: started,
                            finished: finished,
                        }
                    })
                    .collect(),
            ),
            Err(_) => None,
        };

        let tags_from_db: Result<String, rusqlite::Error> = row.get(6);
        let tags: Option<Vec<String>> = match tags_from_db {
            Ok(v) => Some(v.split(",").map(|s| s.to_string()).collect()),
            Err(_) => None,
        };

        Ok(BookFromDb {
            path: row.get(0).expect("No path from db"),
            title: row.get(1).unwrap_or(None),
            author: row.get(2).unwrap_or(None),
            year: row.get(3).unwrap_or(None),
            myRating: row.get(4).unwrap_or(None),
            read: reads,
            tags: tags,
            cover: row.get(7).unwrap_or(None),
            isbn13: row.get(8).unwrap_or(None),
        })
    })?;

    let result: Vec<BookFromDb> = result_iter.filter_map(|p| p.ok()).collect();

    Ok(result)
}

pub fn get_files_by_path(path: String) -> Result<Vec<BookFromDb>, rusqlite::Error> {
    get_files_abstact(format!(
        "WHERE files.path LIKE concat('%', '{}', '%') GROUP BY files.path",
        path
    ))
}

pub fn get_files_by_tag(tag: String) -> Result<Vec<BookFromDb>, rusqlite::Error> {
    get_files_abstact(format!(
        "WHERE files.path IN (SELECT path FROM tags WHERE tag='{}')",
        tag
    ))
}

pub fn get_all_tags() -> Result<Vec<String>, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let mut q = db.prepare("SELECT DISTINCT tag FROM tags")?;

    let result: Vec<String> = q
        .query_map((), |row| Ok(row.get(0).expect("empty tag")))?
        .filter_map(|t| t.ok())
        .collect();

    Ok(result)
}

pub fn get_all_folders() -> Result<Vec<String>, rusqlite::Error> {
    let db = get_db_connection().lock().unwrap();

    let mut q = db.prepare("SELECT DISTINCT path FROM folders")?;

    let result: Vec<String> = q
        .query_map((), |row| Ok(row.get(0).expect("empty tag")))?
        .filter_map(|t| t.ok())
        .collect();

    //   let replaced: Vec<String> = result.iter().map(|s| s.replace(root_path, "")).collect();

    Ok(result)
}
