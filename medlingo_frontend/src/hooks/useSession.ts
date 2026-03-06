// React Hook for Session Management with Database Integration
import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { Session, Conversation, SessionAnalytics } from '../types/session';

interface UseSessionReturn {
  // Session state
  currentSession: Session | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  
  // Session actions
  startSession: (providerId: string, providerLang: string, patientLang: string, patientId?: string) => Promise<Session>;
  endSession: (duration: number, conversationCount: number) => Promise<void>;
  addConversation: (conversation: Omit<Conversation, 'id' | 'sessionId' | 'timestamp'>) => Promise<Conversation>;
  
  // Analytics
  analytics: SessionAnalytics | null;
  loadAnalytics: (providerId: string, startDate?: Date, endDate?: Date) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useSession = (): UseSessionReturn => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startSession = useCallback(async (
    providerId: string, 
    providerLang: string, 
    patientLang: string, 
    patientId?: string
  ): Promise<Session> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const session = await sessionService.createSession({
        providerId,
        patientId,
        providerLanguage: providerLang,
        patientLanguage: patientLang,
      });
      
      setCurrentSession(session);
      setConversations([]);
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endSession = useCallback(async (duration: number, conversationCount: number): Promise<void> => {
    if (!currentSession) {
      throw new Error('No active session to end');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedSession = await sessionService.endSession(
        currentSession.id, 
        duration, 
        conversationCount
      );
      
      setCurrentSession(updatedSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const addConversation = useCallback(async (
    conversation: Omit<Conversation, 'id' | 'sessionId' | 'timestamp'>
  ): Promise<Conversation> => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newConversation = await sessionService.addConversation({
        sessionId: currentSession.id,
        ...conversation,
      });
      
      setConversations(prev => [...prev, newConversation]);
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add conversation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  const loadAnalytics = useCallback(async (
    providerId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const analyticsData = await sessionService.getSessionAnalytics(providerId, startDate, endDate);
      setAnalytics(analyticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load conversations when session changes
  useEffect(() => {
    if (currentSession) {
      sessionService.getSessionConversations(currentSession.id)
        .then(setConversations)
        .catch(err => {
          console.error('Failed to load conversations:', err);
        });
    }
  }, [currentSession]);

  return {
    currentSession,
    conversations,
    isLoading,
    error,
    startSession,
    endSession,
    addConversation,
    analytics,
    loadAnalytics,
    clearError,
  };
};

