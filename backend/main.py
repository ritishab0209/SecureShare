from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import random
import string

app = FastAPI()

# Initialize Firebase
cred = credentials.Certificate("firebase-credentials.json")  # Update with your JSON key path
firebase_admin.initialize_app(cred)
db = firestore.client()

def generate_paste_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

class PasteRequest(BaseModel):
    content: str

@app.post("/create_paste")
def create_paste(paste: PasteRequest):
    paste_id = generate_paste_id()
    db.collection("pastes").document(paste_id).set({
        "content": paste.content
    })
    return {"link": f"https://yourdomain.com/p/{paste_id}"}

@app.get("/p/{paste_id}")
def get_paste(paste_id: str):
    paste_ref = db.collection("pastes").document(paste_id).get()
    if paste_ref.exists:
        return {"content": paste_ref.to_dict()["content"]}
    raise HTTPException(status_code=404, detail="Paste not found")
