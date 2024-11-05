use crate::schema::get_schema;

use super::dbconn::get_db_conn;

// Function to create or open the SQLite database and set up the table
pub async fn create_db_tables() -> Result<(), sqlx::Error> {
    let mut db = get_db_conn().lock().await;

    let files_schema = get_schema();
    sqlx::query("DROP TABLE IF EXISTS folders;")
        .execute(&mut *db)
        .await?;

    sqlx::query("CREATE TABLE folders (path TEXT PRIMARY KEY, name TEXT);")
        .execute(&mut *db)
        .await?;

    let mut columns: Vec<String> = Vec::new();

    let mut side_tables: Vec<String> = Vec::new();
    let mut side_tables_names: Vec<String> = Vec::new();

    for schema_i in files_schema {
        let name = schema_i.name;
        match schema_i.value {
            crate::schema::AttrKey::Text => {
                columns.push(format!("{} TEXT", name));
            }

            crate::schema::AttrKey::Number => {
                columns.push(format!("{} REAL", name));
            }
            crate::schema::AttrKey::TextCollection => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, value TEXT, 
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES files (path) ON DELETE CASCADE);",
                    name
                ));
                side_tables_names.push(name);
            }
            crate::schema::AttrKey::DatesPairCollection => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, started TEXT, finished TEXT,
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES files (path) ON DELETE CASCADE);",
                    name
                ));
                side_tables_names.push(name);
            }
        }
    }

    for tbl in side_tables_names {
        sqlx::query(&format!("DROP TABLE IF EXISTS {}", tbl))
            .execute(&mut *db)
            .await?;
    }

    sqlx::query("DROP TABLE IF EXISTS files")
        .execute(&mut *db)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE files (path TEXT PRIMARY KEY, modified TEXT, {})",
        columns.join(", ")
    ))
    .execute(&mut *db)
    .await?;

    for q in side_tables {
        sqlx::query(&q).execute(&mut *db).await?;
    }

    Ok(())
}
