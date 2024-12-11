use chrono::offset::Utc;
use chrono::DateTime;
use ts_rs::TS;

use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader};

use crate::cache::query::BookFromDb;
use crate::schema::operations::get_schema_cached_safe;
use crate::schema::types::{AttrValue, Schema, SchemaAttrKey};
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

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export)]
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
                    let mut file_meta: HashMap<String, AttrValue> = HashMap::new();

                    println!("\nparse_res: {:?}\n", parse_res);

                    for schema_i in files_schema.items.clone() {
                        let name = schema_i.name;
                        let parsed_attribute: Option<AttrValue> = match parse_res.get(&name) {
                            Some(v) => match serde_yml::from_value(v.clone()) {
                                Ok(v) => Some(v),
                                Err(_) => None,
                            },
                            None => None,
                        };

                        match (parsed_attribute, schema_i.value) {
                            (Some(AttrValue::Text(s)), SchemaAttrKey::Text(_)) => {
                                file_meta.insert(name, AttrValue::Text(s.to_owned()));
                            }

                            (Some(AttrValue::Number(n)), SchemaAttrKey::Number(_)) => {
                                file_meta.insert(name, AttrValue::Number(n));
                            }

                            (
                                Some(AttrValue::TextCollection(vec)),
                                SchemaAttrKey::TextCollection(_),
                            ) => {
                                file_meta.insert(name, AttrValue::TextCollection(vec));
                            }

                            (
                                Some(AttrValue::DatesPairCollection(vec)),
                                SchemaAttrKey::DatesPairCollection(_),
                            ) => {
                                file_meta.insert(name, AttrValue::DatesPairCollection(vec));
                            }

                            // Default values
                            (_, SchemaAttrKey::Text(_)) => {
                                file_meta.insert(name, AttrValue::default_text());
                            }
                            (_, SchemaAttrKey::Number(_)) => {
                                file_meta.insert(name, AttrValue::default_number());
                            }
                            (_, SchemaAttrKey::TextCollection(_)) => {
                                file_meta.insert(name, AttrValue::default_text_collection());
                            }
                            (_, SchemaAttrKey::DatesPairCollection(_)) => {
                                file_meta.insert(name, AttrValue::default_dates_pair_collection());
                            }
                            (_, SchemaAttrKey::Date(_)) => {
                                file_meta.insert(name, AttrValue::default_date());
                            }
                            (_, SchemaAttrKey::DateCollection(_)) => {
                                file_meta.insert(name, AttrValue::default_date_collection());
                            }
                            (_, SchemaAttrKey::Image(_)) => {
                                file_meta.insert(name, AttrValue::default_image());
                            }
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
                            attrs: file_meta,
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

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export)]
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
