// Session Service for Database/Backend Integration
import { 
  Session, 
  Conversation, 
  CreateSessionRequest, 
  UpdateSessionRequest, 
  AddConversationRequest,
  SessionResponse,
  SessionAnalytics 
} from '../types/session';

class SessionService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  // Session Management
  async createSession(request: CreateSessionRequest): Promise<Session> {
    const response = await this.makeRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.session;
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await this.makeRequest(`/sessions/${sessionId}`);
    return response;
  }

  async updateSession(request: UpdateSessionRequest): Promise<Session> {
    const response = await this.makeRequest(`/sessions/${request.sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    return response.session;
  }

  async endSession(sessionId: string, duration: number, conversationCount: number): Promise<Session> {
    return this.updateSession({
      sessionId,
      endTime: new Date(),
      status: 'completed',
      conversationCount,
    });
  }

  // Conversation Management
  async addConversation(request: AddConversationRequest): Promise<Conversation> {
    const response = await this.makeRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.conversation;
  }

  async getSessionConversations(sessionId: string): Promise<Conversation[]> {
    const response = await this.makeRequest(`/sessions/${sessionId}/conversations`);
    return response.conversations;
  }

  // Analytics
  async getSessionAnalytics(providerId: string, startDate?: Date, endDate?: Date): Promise<SessionAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await this.makeRequest(`/analytics/sessions/${providerId}?${params}`);
    return response.analytics;
  }

  // Provider Management
  async getProvider(providerId: string) {
    const response = await this.makeRequest(`/providers/${providerId}`);
    return response.provider;
  }

  async updateProviderLanguage(providerId: string, language: string) {
    const response = await this.makeRequest(`/providers/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify({ defaultLanguage: language }),
    });
    return response.provider;
  }

  // Private helper method
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const sessionService = new SessionService(
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  process.env.EXPO_PUBLIC_API_KEY
);

export default SessionService;

