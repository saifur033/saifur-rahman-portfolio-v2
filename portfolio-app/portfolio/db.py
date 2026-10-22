import sqlite3
from flask import current_app, g
SCHEMA = """
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, title TEXT NOT NULL, slug TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'draft', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(kind,slug));
CREATE INDEX IF NOT EXISTS idx_content_kind_status_order ON content(kind,status,sort_order,id);
CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT UNIQUE NOT NULL, original_name TEXT NOT NULL, mime TEXT NOT NULL, is_private INTEGER NOT NULL DEFAULT 0, content_id INTEGER REFERENCES content(id) ON DELETE SET NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, body TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
"""
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"], timeout=10)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

def init_schema(db):
    db.executescript(SCHEMA)
    db.execute("INSERT OR IGNORE INTO profile(id,data) VALUES(1,'{}')")
    db.commit()

def init_app(app):
    app.teardown_appcontext(close_db)

def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None: db.close()
