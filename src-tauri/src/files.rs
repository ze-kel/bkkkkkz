use chrono::offset::Utc;
use chrono::DateTime;

use std::fs::{self, File};
use std::io::{self, BufRead, BufReader};

use crate::db::BookFromDb;

pub enum FileReadMode {
    OnlyMeta,
    FullFile,
}

fn get_file_modified_time(path_str: &str) -> Result<String, String> {
    match fs::metadata(path_str) {
        Ok(meta) => match meta.modified() {
            Ok(tt) => {
                let time = Into::<DateTime<Utc>>::into(tt);

                Ok(time.to_rfc3339())
            }
            Err(e) => Err(e.to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

pub fn read_file_by_path(path_str: &str, read_mode: FileReadMode) -> Result<BookFromDb, String> {
    let file_modified = match get_file_modified_time(path_str) {
        Ok(v) => v,
        Err(e) => return Err(e),
    };

    let p = path_str.to_string();

    match read_file(&path_str, &read_mode) {
        Ok(fmc) => {
            let parsed2: Result<BookFromDb, serde_yml::Error> = serde_yml::from_str(&fmc.0);
            match parsed2 {
                Ok(mut book) => {
                    book.path = Some(p);
                    book.modified = Some(file_modified);

                    if matches!(read_mode, FileReadMode::FullFile) {
                        book.markdown = Some(fmc.1)
                    }

                    Ok(book)
                }
                // TODO: When error on parsing send notification to frontend that you might lose data on edit
                Err(_) => Ok(BookFromDb {
                    path: Some(p),
                    ..Default::default()
                }),
            }
        }
        Err(e) => return Err(e.to_string()),
    }
}

pub fn save_file(book: BookFromDb) -> Result<String, String> {
    // TODO: handle case when we file content is newer than our stuff

    let mut book_for_serializing = book.to_owned();

    let path = match book.path {
        Some(v) => v,
        None => return Err("No path in book".to_string()),
    };

    let markdown = book.markdown.unwrap_or("".to_string());

    // Omitting fields can be done via serde skip, however then the structure that gets saved to file
    // needs to be different from structure that's sent to frontend(because it serializes too)
    book_for_serializing.markdown = None;
    book_for_serializing.modified = None;
    book_for_serializing.path = None;

    let yaml = match serde_yml::to_string(&book_for_serializing) {
        Ok(v) => v,
        Err(e) => return Err(e.to_string()),
    };
    let file = format!("---\n{yaml}---\n{markdown}");

    match fs::write(path.clone(), file) {
        Ok(_) => (),
        Err(e) => return Err(e.to_string()),
    };

    match get_file_modified_time(&path.clone().as_str()) {
        Ok(v) => Ok(v),
        Err(e) => return Err(e.to_string()),
    }
}

pub fn read_file(file_path: &str, read_mode: &FileReadMode) -> io::Result<(String, String)> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);

    let mut front_matter = String::new();
    let mut content = String::new();

    let mut inside_front_matter = false;
    let mut frontmatter_found = false;

    for line in reader.lines() {
        // TODO: handle cases with no frontmatter better
        let line = line?;

        match (line.trim() == "---", inside_front_matter, frontmatter_found) {
            // Found frontmatter start
            (true, false, false) => {
                inside_front_matter = true;
                content = "".to_string();
            }
            // Inside
            (false, true, _) => {
                front_matter.push_str(&line);
                front_matter.push('\n');
            }
            // Found end
            (true, true, _) => {
                inside_front_matter = false;
                frontmatter_found = true;
                match read_mode {
                    FileReadMode::OnlyMeta => return Ok((front_matter, content)),
                    FileReadMode::FullFile => (),
                }
            }
            // Anything after frontmatter
            (_, _, true) => {
                content.push_str(&line);
                content.push('\n');
            }
            // Ignore anything before frontmatter
            (false, false, false) => (),
        }
    }

    Ok((front_matter, content))
}
