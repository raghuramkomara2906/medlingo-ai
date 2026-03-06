# MedLingo Backend — Phase 1

Minimal FastAPI microservices scaffold for the MedLingo MVP.

## Services (local)
- ASR:       `http://localhost:8081/asr/v1/health`
- Translate: `http://localhost:8082/translate/v1/health`
- TTS:       `http://localhost:8083/tts/v1/health`
- Session:   `http://localhost:8084/session/v1/health`
- Audit:     `http://localhost:8085/audit/v1/health`

## Quick start
1. Create a `.env` file by copying `.env.example` and (optionally) set your keys.
2. Build & run all services:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
