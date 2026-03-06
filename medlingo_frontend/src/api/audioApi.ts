// src/api/audioApi.ts

const GATEWAY_BASE_URL = "http://localhost:8000";

export interface ProcessAudioResult {
  transcript: string;
  translatedText: string;
  audioUrl: string;
  audioBase64: string;
  mime: string;
}

export interface ProcessAudioApiParams {
  fileUri: string;
  sessionId: string;
  sourceLang: string;
  targetLang: string;
  role: "patient" | "physician"; // ✅ aligned with backend
}

/**
 * Send recorded audio + session info to the backend gateway.
 */
export async function processAudioApi({
  fileUri,
  sessionId,
  sourceLang,
  targetLang,
  role,
}: ProcessAudioApiParams): Promise<ProcessAudioResult> {
  console.log("processAudioApi called with:", {
    fileUri,
    sessionId,
    role,
    sourceLang,
    targetLang,
  });

  try {
    // 1️⃣ Prepare payload (JSON string)
    const payload = {
      session_id: sessionId,
      role,
      source_lang: sourceLang,
      target_lang: targetLang,
    };

    // 2️⃣ Build FormData for multipart upload
    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    formData.append("file", {
      uri: fileUri,
      name: "recording.m4a",
      type: "audio/m4a",
    } as any);

    // 3️⃣ Send request to backend
    const response = await fetch(`${GATEWAY_BASE_URL}/v1/audio/process`, {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    console.log("processAudioApi response status:", response.status);

    // 4️⃣ Handle error
    if (!response.ok) {
      const errorText = await response.text().catch(() => "<no body>");
      console.error("processAudioApi error body:", errorText);
      throw new Error(`Audio processing failed: ${response.status}`);
    }

    // 5️⃣ Parse success response
    const data = await response.json();
    console.log("processAudioApi success data:", data);

    return {
      transcript: data.transcript ?? "",
      translatedText: data.translated_text ?? "",
      audioUrl: data.audio_url ?? "",
      audioBase64: data.audio_b64 ?? "",
      mime: data.mime ?? "audio/wav",
    };
  } catch (error) {
    console.error("processAudioApi exception:", error);
    throw error;
  }
}
