# text_to_speech_service/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import azure.cognitiveservices.speech as speechsdk
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Get keys from env
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")

if not AZURE_SPEECH_KEY:
    raise ValueError("AZURE_SPEECH_KEY missing")

class TTSPayload(BaseModel):
    text: str
    lang: str = "es"

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/v1/tts")
def tts(payload: TTSPayload):
    voice_map = {
        "en": "en-US-JennyNeural",
        "es": "es-ES-ElviraNeural"
    }
    voice = voice_map.get(payload.lang, "es-ES-ElviraNeural")
    speech_config = speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION
    )
    speech_config.speech_synthesis_voice_name = voice
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
    result = synthesizer.speak_text_async(payload.text).get()
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return {"audio": list(result.audio_data), "format": "wav"}
    else:
        return {"error": str(result.reason)}