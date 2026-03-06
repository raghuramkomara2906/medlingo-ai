# text_translator_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

KEY = os.getenv("AZURE_TRANSLATOR_KEY")
ENDPOINT = "https://api.cognitive.microsofttranslator.com"

if not KEY:
    raise ValueError("AZURE_TRANSLATOR_KEY missing")

class Payload(BaseModel):
    text: str
    source_lang: str
    target_lang: str

@app.post("/v1/translate")
async def translate(p: Payload):
    if p.source_lang == p.target_lang:
        return {"translated_text": p.text, "skipped": True}

    url = f"{ENDPOINT}/translate?api-version=3.0&from={p.source_lang}&to={p.target_lang}"
    headers = {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/json",
    }
    body = [{"Text": p.text}]
    r = requests.post(url, headers=headers, json=body)
    r.raise_for_status()
    return {"translated_text": r.json()[0]["translations"][0]["text"]}

@app.get("/health")
async def health():
    return {"status": "healthy", "translator_key": "SET"}