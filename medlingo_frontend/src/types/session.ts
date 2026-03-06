// Database/Backend Integration Types for MedLingo Translator

export interface Session {
  id: string;
  providerId: string;
  patientId?: string;
  providerLanguage: string;
  patientLanguage: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  status: 'active' | 'completed' | 'cancelled';
  conversationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  sessionId: string;
  speaker: 'provider' | 'patient';
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  translatedLanguage: string;
  timestamp: Date;
  audioUrl?: string;
  translatedAudioUrl?: string;
  processingTime?: number; // in milliseconds
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  defaultLanguage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionAnalytics {
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;
  mostUsedLanguagePairs: Array<{
    providerLang: string;
    patientLang: string;
    count: number;
  }>;
  conversationsPerSession: number;
  averageProcessingTime: number;
}

// API Request/Response Types
export interface CreateSessionRequest {
  providerId: string;
  patientId?: string;
  providerLanguage: string;
  patientLanguage: string;
}

export interface UpdateSessionRequest {
  sessionId: string;
  endTime?: Date;
  status?: 'completed' | 'cancelled';
  conversationCount?: number;
}

export interface AddConversationRequest {
  sessionId: string;
  speaker: 'provider' | 'patient';
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  translatedLanguage: string;
  audioUrl?: string;
  translatedAudioUrl?: string;
  processingTime?: number;
}

export interface SessionResponse {
  session: Session;
  conversations: Conversation[];
  analytics?: SessionAnalytics;
}

