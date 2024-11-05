use once_cell::sync::OnceCell;

use sqlx::{Connection, SqliteConnection};
use tokio::sync::Mutex;

static DB_CONNECTION: OnceCell<Mutex<SqliteConnection>> = OnceCell::new();

pub fn get_db_conn() -> &'static Mutex<SqliteConnection> {
    DB_CONNECTION.get().expect("Database pool not initialized")
}

pub async fn db_setup() -> Result<(), sqlx::Error> {
    if DB_CONNECTION.get().is_some() {
        return Ok(());
    }

    let conn = SqliteConnection::connect("sqlite:../files.db").await?;

    DB_CONNECTION
        .set(Mutex::new(conn))
        .expect("Database pool already initialized");

    Ok(())
}
