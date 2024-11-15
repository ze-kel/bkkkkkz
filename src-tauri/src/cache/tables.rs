use crate::schema::{
    operations::get_all_schemas_cached,
    types::{AttrKey, Schema},
};

use super::dbconn::get_db_conn;

pub async fn create_db_tables_for_all_schemas() -> Result<(), sqlx::Error> {
    let schemas = get_all_schemas_cached().await;

    for schema in schemas {
        create_db_tables_for_schema(schema).await?;
    }

    Ok(())
}

pub async fn create_db_tables_for_schema(schema: Schema) -> Result<(), sqlx::Error> {
    if schema.items.is_empty() {
        return Ok(());
    }

    let mut db = get_db_conn().lock().await;

    let TableNames {
        table_prefix,
        files_table,
        folders_table,
    } = get_table_names(schema.internal_name.clone());

    sqlx::query(&format!("DROP TABLE IF EXISTS {};", folders_table))
        .execute(&mut *db)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE {} (path TEXT PRIMARY KEY, name TEXT);",
        folders_table
    ))
    .execute(&mut *db)
    .await?;

    let mut columns: Vec<String> = Vec::new();

    let mut side_tables: Vec<String> = Vec::new();
    let mut side_tables_names: Vec<String> = Vec::new();

    for schema_i in schema.items {
        let name = format!("{}{}", table_prefix, schema_i.name);
        match schema_i.value {
            AttrKey::Text | AttrKey::Date | AttrKey::Image => {
                columns.push(format!("{} TEXT", name));
            }
            AttrKey::Number | AttrKey::NumberDecimal => {
                columns.push(format!("{} REAL", name));
            }
            AttrKey::TextCollection | AttrKey::DateCollection => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, value TEXT, 
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES {} (path) ON DELETE CASCADE);",
                    name, files_table
                ));
                side_tables_names.push(name);
            }
            AttrKey::DatesPairCollection => {
                side_tables.push(format!(
                    "CREATE TABLE {} 
                    (id INTEGER PRIMARY KEY, ind INTEGER, path TEXT, started TEXT, finished TEXT,
                    UNIQUE(ind,path) FOREIGN KEY (path) 
                    REFERENCES {} (path) ON DELETE CASCADE);",
                    name, files_table
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

    sqlx::query(&format!("DROP TABLE IF EXISTS {}", files_table))
        .execute(&mut *db)
        .await?;

    sqlx::query(&format!(
        "CREATE TABLE {} (path TEXT PRIMARY KEY, modified TEXT, {})",
        files_table,
        columns.join(", ")
    ))
    .execute(&mut *db)
    .await?;

    for q in side_tables {
        sqlx::query(&q).execute(&mut *db).await?;
    }

    Ok(())
}

pub struct TableNames {
    pub table_prefix: String,
    pub files_table: String,
    pub folders_table: String,
}

pub fn get_table_names(schema_internal_name: String) -> TableNames {
    let table_prefix = format!("{}_", schema_internal_name);
    return TableNames {
        table_prefix: table_prefix.clone(),
        files_table: format!("{}{}", table_prefix.clone(), "files"),
        folders_table: format!("{}{}", table_prefix.clone(), "folders"),
    };
}
