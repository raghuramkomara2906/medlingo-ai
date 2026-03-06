# Dockerfile (in root)
FROM python:3.12-slim

WORKDIR /app

# Copy all main.py
COPY speech_to_text_service/main.py /app/speech_main.py
COPY text_translator_service/main.py /app/trans_main.py
COPY text_to_speech_service/main.py /app/tts_main.py

# Install deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Run all services
CMD ["bash", "-c", "\
  uvicorn speech_main:app --host 0.0.0.0 --port 8002 & \
  uvicorn trans_main:app --host 0.0.0.0 --port 8003 & \
  uvicorn tts_main:app --host 0.0.0.0 --port 8004 & \
  wait \
"]