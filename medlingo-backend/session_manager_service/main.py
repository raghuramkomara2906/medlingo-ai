# session_manager_service/main.py – FINAL: 45-min TTL + created_at + valid flag
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MedLingo Session Manager")

_sessions = {}
TTL = 2700  # 45 minutes

class SessionCreate(BaseModel):
    consent: bool
    langs: dict

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/v1/sessions")
def create_session(payload: SessionCreate):
    if not payload.consent:
        raise HTTPException(400, "Consent required")
    
    sid = str(uuid.uuid4())
    created_at = time.time()
    expires = datetime.utcnow() + timedelta(seconds=TTL)
    
    _sessions[sid] = {
        "consent": True,
        "langs": payload.langs or {"source": "en", "target": "es"},
        "created_at": created_at,
        "expires_at": expires
    }
    
    logger.info(f"[SESSION] Created {sid}")
    return {
        "session_id": sid,
        "expires_at": expires.isoformat(),
        "created_at": created_at
    }

@app.get("/v1/sessions/{sid}")
def get_session(sid: str):
    s = _sessions.get(sid)
    if not s or s["expires_at"] < datetime.utcnow():
        raise HTTPException(404, "Session not found or expired")
    
    return {
        "valid": True,
        "langs": s["langs"],
        "created_at": s["created_at"]
    }

@app.post("/v1/sessions/{sid}/close")
def close_session(sid: str):
    s = _sessions.get(sid)
    if not s:
        raise HTTPException(404, "Session not found")
    
    del _sessions[sid]
    logger.info(f"[SESSION] Closed {sid}")
    return {"ok": True}