# speech_main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
import azure.cognitiveservices.speech as speechsdk
import logging
import os
from typing import AsyncGenerator, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Get keys from env
SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")

if not SPEECH_KEY:
    raise ValueError("AZURE_SPEECH_KEY missing")

# Just a health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy", "speech_key": "SET"}
# ASR endpoint
@app.post("/v1/asr")
async def asr(file: UploadFile = File(...), source_lang: str = Query("en-US")):
    audio = await file.read()
    logger.info("[ASR] %d bytes, lang=%s", len(audio), source_lang)

    stream = speechsdk.audio.PushAudioInputStream()
    audio_config = speechsdk.audio.AudioConfig(stream=stream)
    speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
    speech_config.speech_recognition_language = source_lang
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
    # Handlers for recognized and recognizing events
    queue = []
    def on_recognized(evt):
        if evt.result.text:
            queue.append({"type": "final", "text": evt.result.text.strip()})
    def on_recognizing(evt):
        if evt.result.text:
            queue.append({"type": "partial", "text": evt.result.text.strip()})
    # Connect handlers
    recognizer.recognized.connect(on_recognized)
    recognizer.recognizing.connect(on_recognizing)
    recognizer.start_continuous_recognition()
    # Push audio data
    stream.write(audio)
    stream.close()

    # Wait for results
    import time
    time.sleep(3)
    # Collect results
    partial = [m["text"] for m in queue if m["type"] == "partial"]
    final = [m["text"] for m in queue if m["type"] == "final"]
    text = " ".join(final) or " ".join(partial)
    # Stop recognition
    recognizer.stop_continuous_recognition()
    return {"text": text, "partials": partial, "finals": final}