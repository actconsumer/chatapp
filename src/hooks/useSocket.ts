import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services';
import { useAuth } from '../context/AuthContext';

type EventCallback = (data: any) => void;

export const useSocket = () => {
  const { isAuthenticated } = useAuth();
  const listenersRef = useRef<Map<string, EventCallback>>(new Map());

  useEffect(() => {
    if (isAuthenticated && !socketService.isConnected()) {
      // Connect socket when user is authenticated
      socketService.connect().catch(error => {
        console.error('Socket connection failed:', error);
      });
    }

    return () => {
      // Cleanup all listeners when component unmounts
      listenersRef.current.forEach((callback, event) => {
        socketService.off(event, callback);
      });
      listenersRef.current.clear();
    };
  }, [isAuthenticated]);

  const on = useCallback((event: string, callback: EventCallback) => {
    socketService.on(event, callback);
    listenersRef.current.set(event, callback);
  }, []);

  const off = useCallback((event: string) => {
    const callback = listenersRef.current.get(event);
    if (callback) {
      socketService.off(event, callback);
      listenersRef.current.delete(event);
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketService.send(event, data);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketService.leaveConversation(conversationId);
  }, []);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketService.sendTyping(conversationId, isTyping);
  }, []);

  const sendMessageRead = useCallback((conversationId: string, messageId: string) => {
    socketService.sendMessageRead(conversationId, messageId);
  }, []);

  const updatePresence = useCallback((status: 'online' | 'offline' | 'away') => {
    socketService.updatePresence(status);
  }, []);

  const sendCallSignal = useCallback((data: any) => {
    socketService.sendCallSignal(data);
  }, []);

  const joinCall = useCallback((callId: string) => {
    socketService.joinCall(callId);
  }, []);

  const leaveCall = useCallback((callId: string) => {
    socketService.leaveCall(callId);
  }, []);

  return {
    isConnected: socketService.isConnected(),
    on,
    off,
    emit,
    joinConversation,
    leaveConversation,
    sendTyping,
    sendMessageRead,
    updatePresence,
    sendCallSignal,
    joinCall,
    leaveCall,
  };
};

export default useSocket;