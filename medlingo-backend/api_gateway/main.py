# api_gateway/main.py – FINAL: Role + Language + Session Duration + Audit + No Auth (for now)
import os, io, uuid, json, base64, time, logging
from typing import Dict
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydub import AudioSegment
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gateway")

app = FastAPI(title="MedLingo Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

SAVE_DIR = os.environ.get("AUDIO_OUT_DIR", "/app/audio_output")
os.makedirs(SAVE_DIR, exist_ok=True)
PUBLIC_BASE = (os.environ.get("PUBLIC_BASE") or "").strip() or "http://localhost:8000"

def sanitize_url(u: str) -> str:
    return u.strip().replace(" ", "").replace("\n", "").replace("\t", "")

SESSION_SERVICE = "http://session_manager_service:8000"
AUDIT_SERVICE = "http://audit_service:8000"

# Role-based language mapping
ROLE_LANGS = {
    "patient": {"source": "es", "target": "en"},
    "physician": {"source": "en", "target": "es"}
}

class AudioPayload(BaseModel):
    session_id: str
    role: str  # "patient" or "physician"
    source_lang: str = None
    target_lang: str = None

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = os.path.join(SAVE_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return StreamingResponse(open(file_path, "rb"), media_type="audio/wav")

@app.post("/v1/audio/process")
async def process_audio(
    request: Request,
    payload: str = Form(...),
    file: UploadFile = File(...)
):
    conversation_start = time.time()

    try:
        payload_dict = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in payload")

    p = AudioPayload(**payload_dict)

    # --- Role validation ---
    if p.role not in ROLE_LANGS:
        raise HTTPException(status_code=400, detail="Invalid role. Use 'patient' or 'physician'")

    # --- Enforce role-based languages ---
    src_lang = p.source_lang or ROLE_LANGS[p.role]["source"]
    tgt_lang = p.target_lang or ROLE_LANGS[p.role]["target"]

    # --- Session validation ---
    session_resp = requests.get(f"{SESSION_SERVICE}/v1/sessions/{p.session_id}", timeout=10)
    if not session_resp.ok:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    session_data = session_resp.json()
    if not session_data.get("valid"):
        raise HTTPException(status_code=401, detail="Session invalid")

    # --- Session duration ---
    session_created_at = session_data.get("created_at", 0)
    session_duration = time.time() - session_created_at

    # --- M4A → WAV ---
    raw_bytes = await file.read()
    file_ext = (file.filename or "").lower().rsplit(".", 1)[-1] if "." in (file.filename or "") else ""

    if file_ext == "m4a":
        logger.info("[Gateway] Converting M4A → WAV")
        audio = AudioSegment.from_file(io.BytesIO(raw_bytes), format="m4a")
        audio = audio.set_frame_rate(16000).set_channels(1)
        buff = io.BytesIO()
        audio.export(buff, format="wav")
        raw_bytes = buff.getvalue()

    # --- ASR ---
    asr_start = time.time()
    asr_url = "http://speech_to_text_service:8000/v1/asr"
    files = {"file": ("input.wav", raw_bytes, "audio/wav")}
    params = {"source_lang": src_lang if "-" in src_lang else "en-US"}
    asr_resp = requests.post(asr_url, files=files, params=params, timeout=60)
    asr_resp.raise_for_status()
    asr_text = asr_resp.json().get("text", "").strip()
    asr_time = time.time() - asr_start

    if not asr_text:
        return JSONResponse({
            "transcript": "", "translated_text": "", "audio_preview": [], "audio_url": "", "audio_b64": "", "mime": "audio/wav"
        })

    # --- Translate ---
    trans_start = time.time()
    trans_url = "http://text_translator_service:8000/v1/translate"
    trans_payload = {"text": asr_text, "source_lang": src_lang, "target_lang": tgt_lang}
    trans_resp = requests.post(trans_url, json=trans_payload, timeout=60)
    trans_resp.raise_for_status()
    translated_text = trans_resp.json().get("translated_text", "").strip()
    trans_time = time.time() - trans_start

    # --- TTS ---
    tts_start = time.time()
    tts_url = "http://text_to_speech_service:8000/v1/tts"
    tts_payload = {"text": translated_text, "lang": tgt_lang}
    tts_resp = requests.post(tts_url, json=tts_payload, timeout=60)
    tts_resp.raise_for_status()
    audio_frames = tts_resp.json().get("audio", [])
    tts_time = time.time() - tts_start

    # --- Save .wav ---
    wav_bytes = bytes(audio_frames)
    filename = f"tts_{uuid.uuid4().hex}.wav"
    file_path = os.path.join(SAVE_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(wav_bytes)

    # --- URL + Base64 ---
    audio_url = sanitize_url(f"{PUBLIC_BASE}/audio/{filename}")
    audio_b64 = base64.b64encode(wav_bytes).decode("ascii")
    audio_preview = audio_frames[:5]

    # --- Audit ---
    conversation_duration = time.time() - conversation_start
    requests.post(f"{AUDIT_SERVICE}/v1/log", json={
        "event_type": "audio_processed",
        "session_id": p.session_id,
        "data": {
            "role": p.role,
            "source_lang": src_lang,
            "target_lang": tgt_lang,
            "latency_asr": round(asr_time, 3),
            "latency_translate": round(trans_time, 3),
            "latency_tts": round(tts_time, 3),
            "total_latency": round(conversation_duration, 3),
            "transcript_length": len(asr_text),
            "filename": filename,
            "session_duration": round(session_duration, 3)
        }
    })

    return JSONResponse({
        "transcript": asr_text,
        "translated_text": translated_text,
        "audio_preview": audio_preview,
        "audio_url": audio_url,
        "audio_b64": audio_b64,
        "mime": "audio/wav",
        "role": p.role,
        "source_lang": src_lang,
        "target_lang": tgt_lang
    })