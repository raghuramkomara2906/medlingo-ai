// src/api/sessionApi.ts

// base URL of backend session service
const SESSION_BASE_URL = "http://localhost:8001"; 
// If you ever change the port in docker/.env, change it here too

export type StartSessionResponse = {
  session_id: string;
  expires_at: string;
};

// This function will call POST /v1/sessions on your backend
export async function startSessionApi(
    consent: boolean,
    sourceLang: string = "en",
    targetLang: string = "es"
  ): Promise<StartSessionResponse> {
    const body = {
      consent,
      langs: {
        source: sourceLang,
        target: targetLang,
      },
    };
  
    console.log("Calling session API at:", `${SESSION_BASE_URL}/v1/sessions`, "with body:", body);
  
    const response = await fetch(`${SESSION_BASE_URL}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  
    console.log("Session API response status:", response.status);
  
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Start session error body:", errorText);
      throw new Error(`Failed to start session: ${response.status}`);
    }
  
    const data = await response.json();
    console.log("Session API success data:", data);
    return data;
  }
  

// For now, ending a session is just a frontend action.
// We keep this function so the UI can call it and we can add backend logic later if needed.
export async function endSessionApi(sessionId: string | null): Promise<void> {
  console.log("Ending session on frontend for:", sessionId);
  // Future: call DELETE /v1/sessions/{sid} or similar when backend supports it
}

