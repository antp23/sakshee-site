from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import sqlite3, os, shutil, uuid, json
from datetime import datetime
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = Path(__file__).parent.parent
PHOTOS = BASE / "photos"
DB_PATH = BASE / "cms" / "cms.db"

ALLOWED = {
    "image": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"},
    "video": {".mp4", ".mov", ".avi", ".mkv", ".m4v"},
    "document": {".pdf", ".doc", ".docx"},
}
ALL_ALLOWED = {ext for exts in ALLOWED.values() for ext in exts}

# --- DB ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            section TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT,
            file_type TEXT,
            size INTEGER,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS blog_posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subtitle TEXT,
            body TEXT,
            tags TEXT,
            cover_image TEXT,
            published INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()

init_db()

# --- HELPERS ---
def file_type(ext):
    for t, exts in ALLOWED.items():
        if ext.lower() in exts:
            return t
    return "other"

def save_file(upload: UploadFile, section: str) -> dict:
    ext = Path(upload.filename).suffix.lower()
    if ext not in ALL_ALLOWED:
        raise HTTPException(400, f"File type {ext} not allowed")
    uid = str(uuid.uuid4())
    filename = f"{uid}{ext}"
    dest = PHOTOS / section / filename
    dest.parent.mkdir(exist_ok=True)
    with open(dest, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    size = dest.stat().st_size
    return {"id": uid, "filename": filename, "original_name": upload.filename,
            "file_type": file_type(ext), "size": size}

# --- FILE ENDPOINTS ---
@app.post("/upload/{section}")
async def upload_file(section: str, file: UploadFile = File(...)):
    if section not in ("acting", "modeling", "blog"):
        raise HTTPException(400, "Invalid section")
    info = save_file(file, section)
    conn = get_db()
    max_order = conn.execute("SELECT MAX(sort_order) FROM files WHERE section=?", (section,)).fetchone()[0] or 0
    conn.execute(
        "INSERT INTO files (id, section, filename, original_name, file_type, size, sort_order) VALUES (?,?,?,?,?,?,?)",
        (info["id"], section, info["filename"], info["original_name"], info["file_type"], info["size"], max_order + 1)
    )
    conn.commit()
    conn.close()
    return {**info, "url": f"/photos/{section}/{info['filename']}"}

@app.get("/files/{section}")
def list_files(section: str):
    conn = get_db()
    rows = conn.execute("SELECT * FROM files WHERE section=? ORDER BY sort_order ASC, created_at ASC", (section,)).fetchall()
    conn.close()
    return [{"id": r["id"], "filename": r["filename"], "original_name": r["original_name"],
             "file_type": r["file_type"], "size": r["size"], "sort_order": r["sort_order"],
             "created_at": r["created_at"], "url": f"/photos/{section}/{r['filename']}"} for r in rows]

@app.delete("/files/{section}/{file_id}")
def delete_file(section: str, file_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM files WHERE id=? AND section=?", (file_id, section)).fetchone()
    if not row:
        raise HTTPException(404, "File not found")
    path = PHOTOS / section / row["filename"]
    if path.exists():
        path.unlink()
    conn.execute("DELETE FROM files WHERE id=?", (file_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.patch("/files/{section}/{file_id}/order")
def reorder_file(section: str, file_id: str, order: int):
    conn = get_db()
    conn.execute("UPDATE files SET sort_order=? WHERE id=? AND section=?", (order, file_id, section))
    conn.commit()
    conn.close()
    return {"ok": True}

# --- BLOG ENDPOINTS ---
class BlogPost(BaseModel):
    title: str
    subtitle: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[str] = None
    cover_image: Optional[str] = None
    published: Optional[bool] = False

@app.get("/blog")
def list_posts():
    conn = get_db()
    rows = conn.execute("SELECT * FROM blog_posts ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/blog/{post_id}")
def get_post(post_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM blog_posts WHERE id=?", (post_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Post not found")
    return dict(row)

@app.post("/blog")
def create_post(post: BlogPost):
    uid = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO blog_posts (id, title, subtitle, body, tags, cover_image, published) VALUES (?,?,?,?,?,?,?)",
        (uid, post.title, post.subtitle, post.body, post.tags, post.cover_image, int(post.published or False))
    )
    conn.commit()
    conn.close()
    return {"id": uid, **post.dict()}

@app.put("/blog/{post_id}")
def update_post(post_id: str, post: BlogPost):
    conn = get_db()
    conn.execute(
        "UPDATE blog_posts SET title=?, subtitle=?, body=?, tags=?, cover_image=?, published=?, updated_at=datetime('now') WHERE id=?",
        (post.title, post.subtitle, post.body, post.tags, post.cover_image, int(post.published or False), post_id)
    )
    conn.commit()
    conn.close()
    return {"id": post_id, **post.dict()}

@app.delete("/blog/{post_id}")
def delete_post(post_id: str):
    conn = get_db()
    conn.execute("DELETE FROM blog_posts WHERE id=?", (post_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.post("/blog/{post_id}/cover")
async def upload_cover(post_id: str, file: UploadFile = File(...)):
    info = save_file(file, "blog")
    url = f"/photos/blog/{info['filename']}"
    conn = get_db()
    conn.execute("UPDATE blog_posts SET cover_image=? WHERE id=?", (url, post_id))
    conn.commit()
    conn.close()
    return {"url": url}

# --- SERVE STATIC SITE ---
# Mount last so API routes take priority
app.mount("/", StaticFiles(directory=str(BASE), html=True), name="static")
