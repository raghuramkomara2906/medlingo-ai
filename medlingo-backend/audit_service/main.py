# audit_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import logging
import json
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
LOG_FILE = "/app/data/audit.log"
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

class LogEvent(BaseModel):
    event_type: str
    session_id: str
    user_id: str = "anonymous"
    data: dict = {}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/v1/log")
def log_event(event: LogEvent):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event.event_type,
        "session_id": event.session_id,
        "user_id": event.user_id,
        "data": event.data
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    logger.info(f"[AUDIT] {event.event_type} | {event.session_id}")
    return {"ok": True}