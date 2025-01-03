use chrono::offset::Utc;
use chrono::DateTime;

use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader};

use crate::cache::query::BookFromDb;
use crate::schema::operations::get_schema_cached_safe;
use crate::schema::types::{AttrKey, AttrValue, DateRead, Schema};
use crate::utils::errorhandling::{ErrorActionCode, ErrorFromRust};

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

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BookReadResult {
    pub book: BookFromDb,
    pub parsing_error: Option<ErrorFromRust>,
    pub schema: Schema,
}

pub async fn read_file_by_path(
    path_str: &str,
    read_mode: FileReadMode,
) -> Result<BookReadResult, ErrorFromRust> {
    let file_modified = match get_file_modified_time(path_str) {
        Ok(v) => v,
        Err(e) => {
            return Err(ErrorFromRust::new("Error reading file")
                .raw(e)
                .action_c(ErrorActionCode::FileReadRetry, "Retry"))
        }
    };

    let files_schema = get_schema_cached_safe(path_str).await?;

    let p = path_str.to_string();

    match read_file(&path_str, &read_mode) {
        Ok(fmc) => {
            let parsed_meta: Result<HashMap<String, serde_yml::Value>, serde_yml::Error> =
                serde_yml::from_str(&fmc.0);

            match parsed_meta {
                Ok(parse_res) => {
                    let mut hm: HashMap<String, AttrValue> = HashMap::new();

                    for schema_i in files_schema.items.clone() {
                        let name = schema_i.name;
                        let value_in_meta = parse_res.get(&name);

                        match (value_in_meta, schema_i.value) {
                            (Some(serde_yml::Value::String(s)), AttrKey::Text(_)) => {
                                hm.insert(name, AttrValue::Text(s.to_owned()));
                            }

                            (Some(serde_yml::Value::Number(n)), AttrKey::Number(_)) => {
                                if let Some(nn) = n.as_f64() {
                                    hm.insert(name, AttrValue::Number(nn));
                                }
                            }

                            (Some(serde_yml::Value::Sequence(vec)), AttrKey::TextCollection(_)) => {
                                let clear = vec
                                    .iter()
                                    .filter_map(|f| match f {
                                        serde_yml::Value::String(s) => Some(s.to_owned()),
                                        _ => None,
                                    })
                                    .collect();

                                hm.insert(name, AttrValue::TextCollection(clear));
                            }

                            (
                                Some(serde_yml::Value::Sequence(vec)),
                                AttrKey::DatesPairCollection(_),
                            ) => {
                                let clear = vec
                                    .iter()
                                    .filter_map(|f| match f {
                                        serde_yml::Value::Mapping(mm) => Some(DateRead {
                                            started: match mm.get("started") {
                                                Some(v) => match v {
                                                    serde_yml::Value::String(v) => {
                                                        Some(v.to_owned())
                                                    }
                                                    _ => None,
                                                },
                                                None => None,
                                            },
                                            finished: match mm.get("finished") {
                                                Some(v) => match v {
                                                    serde_yml::Value::String(v) => {
                                                        Some(v.to_owned())
                                                    }
                                                    _ => None,
                                                },
                                                None => None,
                                            },
                                        }),
                                        _ => None,
                                    })
                                    .collect();
                                hm.insert(name, AttrValue::DatesPairCollection(clear));
                            }
                            (_, _) => (),
                        }
                    }

                    Ok(BookReadResult {
                        book: BookFromDb {
                            path: Some(p),
                            markdown: match read_mode {
                                FileReadMode::OnlyMeta => None,
                                FileReadMode::FullFile => Some(fmc.1),
                            },
                            modified: Some(file_modified),
                            attrs: hm,
                            ..Default::default()
                        },
                        parsing_error: None,
                        schema: files_schema,
                    })
                }
                Err(e) => Ok(BookReadResult {
                    book: BookFromDb {
                        path: Some(p),
                        modified: Some(file_modified),
                        markdown: match read_mode {
                            FileReadMode::OnlyMeta => None,
                            FileReadMode::FullFile => Some(fmc.1),
                        },
                        ..Default::default()
                    },
                    parsing_error: Some(
                        ErrorFromRust::new("Parsing error")
                            .info("Metadata might be lost on save")
                            .raw(e),
                    ),
                    schema: files_schema,
                }),
            }
        }
        Err(e) => {
            return Err(ErrorFromRust::new("Error reading file")
                .raw(e)
                .action_c(ErrorActionCode::FileReadRetry, "Retry"))
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BookSaveResult {
    pub path: String,
    pub modified: String,
}

pub fn save_file(book: BookFromDb, forced: bool) -> Result<BookSaveResult, ErrorFromRust> {
    let path = match book.path {
        Some(v) => v,
        None => {
            return Err(ErrorFromRust::new("No path in book")
                .info("This is likely a frontend bug. Copy unsaved content and restart the app"))
        }
    };

    if !forced {
        match book.modified {
            Some(v) => {
                let modified_before =
                    match get_file_modified_time(&path.clone().as_str()) {
                        Ok(v) => v,
                        Err(e) => return Err(ErrorFromRust::new(
                            "Unable to get modified date from file on disk",
                        )
                        .info(
                            "Retry only if you are sure there is no important data in file on disk",
                        )
                        .action_c(ErrorActionCode::FileSaveRetryForced, "Save anyway")
                        .raw(e)),
                    };

                if v != modified_before {
                    return Err(ErrorFromRust::new("File was modified by something else")
                        .action_c(ErrorActionCode::FileSaveRetryForced, "Overwrite"));
                }
            }
            None => (),
        }
    }

    let markdown = book.markdown.unwrap_or("".to_string());

    let yaml = serde_yml::to_string(&book.attrs).map_err(|e| {
        ErrorFromRust::new("Error serializing book metadata")
            .info("File was not saved")
            .raw(e)
    })?;

    let file = format!("---\n{yaml}---\n{markdown}");

    fs::write(path.clone(), file).map_err(|e| {
        ErrorFromRust::new("Error writing to disk")
            .info("File was not saved")
            .raw(e)
            .action_c(ErrorActionCode::FileSaveRetry, "Retry")
    })?;

    match get_file_modified_time(&path.clone().as_str()) {
        Ok(v) => Ok(BookSaveResult {
            path: path,
            modified: v,
        }),
        Err(e) => return Err(
            ErrorFromRust::new("Error getting update file modification date")
                .info("File should be saved. Expect to get a warning next time you save this file")
                .raw(e),
        ),
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
