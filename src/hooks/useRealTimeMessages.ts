// hooks/useRealTimeMessages.ts - Simple polling approach
import { useEffect, useRef } from "react";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  conversationId: string; // ✅ added so it matches SocketMessage shape
}

interface UseRealTimeConfig {
  conversationId: string | null;
  onNewMessage?: (message: Message) => void;
  enabled?: boolean;
}

export const useRealTimeMessages = ({
  conversationId,
  onNewMessage,
  enabled = true,
}: UseRealTimeConfig) => {
  const lastMessageIdRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId || !enabled || !onNewMessage) return;

    const pollForNewMessages = async () => {
      try {
        const params = new URLSearchParams({
          conversationId,
          ...(lastMessageIdRef.current && { after: lastMessageIdRef.current }),
        });

        const response = await fetch(`/api/messages/poll?${params}`);
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();

        if (data.success && data.messages.length > 0) {
          data.messages.forEach((message: Message) => {
            onNewMessage(message);
            lastMessageIdRef.current = message.id;
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // First run immediately, then poll every 2s
    pollForNewMessages();
    pollIntervalRef.current = setInterval(pollForNewMessages, 2000);

    // Cleanup when unmounting or switching conversation
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [conversationId, enabled, onNewMessage]);

  return {
    isConnected: enabled,
    startPolling: () => {}, // stub for API parity
    stopPolling: () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    },
  };
};
