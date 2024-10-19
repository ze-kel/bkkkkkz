use gray_matter::engine::YAML;
use gray_matter::Matter;

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
    let matter = Matter::<YAML>::new();

    let file_modified = match get_file_modified_time(path_str) {
        Ok(v) => v,
        Err(e) => return Err(e),
    };

    let file_content = match read_mode {
        FileReadMode::OnlyMeta => read_front_matter(&path_str),
        FileReadMode::FullFile => fs::read_to_string(&path_str),
    };
    let p = path_str.to_string();

    match file_content {
        Ok(text) => {
            let parsed = matter.parse(&text);
            match parsed.data {
                Some(data) => {
                    let des: Result<BookFromDb, serde_json::Error> = data.deserialize();
                    match des {
                        Ok(mut book) => {
                            book.path = Some(p);
                            book.modified = Some(file_modified);

                            if matches!(read_mode, FileReadMode::FullFile) {
                                book.markdown = Some(parsed.content)
                            }

                            Ok(book)
                        }
                        Err(e) => Err(e.to_string()),
                    }
                }
                None => Ok(BookFromDb {
                    path: Some(p),
                    ..Default::default()
                }),
            }
        }
        Err(e) => return Err(e.to_string()),
    }
}

pub fn read_front_matter(file_path: &str) -> io::Result<String> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);

    let mut front_matter = String::new();
    let mut inside_front_matter = false;

    for line in reader.lines() {
        // TODO: handle cases with no frontmatter better
        let line = line?;

        if line.trim() == "---" {
            if inside_front_matter {
                front_matter.push_str(&line);
                front_matter.push('\n');
                return Ok(front_matter);
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

    Ok(front_matter)
}
