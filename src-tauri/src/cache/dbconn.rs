use once_cell::sync::OnceCell;

use sqlx::{sqlite::SqliteConnectOptions, Connection, SqliteConnection};
use tokio::sync::Mutex;

static DB_CONNECTION: OnceCell<Mutex<SqliteConnection>> = OnceCell::new();

pub fn get_db_conn() -> &'static Mutex<SqliteConnection> {
    DB_CONNECTION
        .get()
        .expect("Database connection not initialized")
}

pub async fn db_setup() -> Result<(), sqlx::Error> {
    if DB_CONNECTION.get().is_some() {
        return Ok(());
    }
    let options = SqliteConnectOptions::new()
        .filename("files.db")
        .create_if_missing(true);

    let conn = SqliteConnection::connect_with(&options).await?;

    DB_CONNECTION
        .set(Mutex::new(conn))
        .expect("Database connection already initialized");

    Ok(())
}
