from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncpg
import random
import string

app = FastAPI()

DATABASE_URL = "postgresql://myuser:kali@localhost:5432/pastebin"

async def connect_db():
    return await asyncpg.connect(DATABASE_URL)

def generate_paste_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

class PasteRequest(BaseModel):
    content: str

@app.post("/create_paste")
async def create_paste(paste: PasteRequest):
    paste_id = generate_paste_id()
    db = await connect_db()
    await db.execute("INSERT INTO pastes (paste_id, content) VALUES ($1, $2)", paste_id, paste.content)
    await db.close()
    return {"link": f"http://127.0.0.1:8000/p/{paste_id}"}

@app.get("/p/{paste_id}")
async def get_paste(paste_id: str):
    db = await connect_db()
    paste = await db.fetchrow("SELECT content FROM pastes WHERE paste_id = $1", paste_id)
    await db.close()
    
    if paste:
        return {"content": paste["content"]}
    raise HTTPException(status_code=404, detail="Paste not found")
