"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRealTimeMessages } from "@/hooks/useRealTimeMessages";
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  tempId?: string;
  isOptimistic?: boolean;
  conversationId?: string;
}



interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    role: "customer" | "handyman";
  }>;
  lastMessage: Message | null;
  isActive: boolean;
  jobContext?: {
    jobId: string;
    jobTitle: string;
    category?: string;
  };
}

export default function MessagesPage() {
  const { data: session } = useSession();

  // ✅ Your original state - unchanged
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

// ✅ Your original refs - unchanged
const initializedRef = useRef(false);
const urlProcessedRef = useRef(false);

// ✅ Add Socket.io integration with minimal changes
// ✅ Add Socket.io related interfaces
interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  tempId?: string;
}

interface UseSocketProps {
  onNewMessage: (socketMessage: SocketMessage) => void;
  onMessageUpdate: (tempId: string, socketMessage: SocketMessage) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  onlineUsers: string[];
  typingUsers: Array<{
    userId: string;
    userName: string;
    conversationId: string;
  }>;
  sendMessage: (conversationId: string, content: string) => string;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

const { isConnected, startPolling, stopPolling } = useRealTimeMessages({
  conversationId: selectedConversationId,
  // Handle new messages
  onNewMessage: useCallback(
    (message: Message) => {
      const newMsg: Message = {
        id: message.id,
        conversationId: message.conversationId, // ✅ now allowed
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        timestamp: message.timestamp,
        isRead: message.isRead,
        canEdit: message.senderId === session?.user?.id && !message.isRead,
        canDelete: message.senderId === session?.user?.id && !message.isRead,
        tempId: message.tempId,
        isOptimistic: false,
      };

      setMessages((prev: Message[]) => {
        const exists = prev.some((msg: Message) => msg.id === newMsg.id);
        if (exists) return prev;
        return [...prev, newMsg];
      });

      // ✅ update conversation list
      setConversations((prev: Conversation[]) =>
        prev.map((conv: Conversation) =>
          conv.id === selectedConversationId
            ? {
                ...conv,
                lastMessage: {
                  id: message.id,
                  senderId: message.senderId,
                  senderName: message.senderName,
                  content: message.content,
                  timestamp: message.timestamp,
                  isRead: message.isRead,
                },
              }
            : conv
        )
      );
    },
    [selectedConversationId, session?.user?.id]
  ),
});

// Mock Socket.io functionality since the hook doesn't provide it
const onlineUsers: string[] = [];
const typingUsers: Array<{
  userId: string;
  userName: string;
  conversationId: string;
}> = [];
const socketSendMessage = (conversationId: string, content: string): string => {
  return Math.random().toString(36);
};
const joinConversation = (conversationId: string) => {};
const leaveConversation = (conversationId: string) => {};
const startTyping = (conversationId: string) => {};
const stopTyping = (conversationId: string) => {};

// ✅ Get typing users for current conversation
const currentTypingUsers = typingUsers.filter(
  (user) =>
    user.conversationId === selectedConversationId &&
    user.userId !== session?.user?.id
);

// ✅ Your original loadConversations function - unchanged
const loadConversations = async () => {
  try {
    const response = await fetch("/api/conversations");
    const data = await response.json();
    if (data.success) {
      setConversations(data.conversations);
    }
  } catch (error) {
    console.error("Failed to load conversations:", error);
  }
};

// ✅ Your original loadMessages function with Socket.io integration
const loadMessages = async (conversationId: string) => {
  try {
    // Leave previous conversation room
    if (selectedConversationId) {
      leaveConversation(selectedConversationId);
      stopTyping(selectedConversationId);
    }

    const response = await fetch(
      `/api/messages?conversationId=${conversationId}`
    );
    const data = await response.json();
    if (data.success) {
      setMessages(data.messages);
      setSelectedConversationId(conversationId);

      // Join new conversation room
      joinConversation(conversationId);
    }
  } catch (error) {
    console.error("Failed to load messages:", error);
  }
};

// ✅ Your original processURLParameters function - unchanged
const processURLParameters = async () => {
  const currentURL = window.location.search;
  const urlKey = `processed_${currentURL}`;

  if (sessionStorage.getItem(urlKey) || urlProcessedRef.current) {
    return false;
  }

  urlProcessedRef.current = true;
  sessionStorage.setItem(urlKey, "true");

  const params = new URLSearchParams(currentURL);
  const jobId = params.get("job");
  const customerId = params.get("customerId");
  const jobTitle = params.get("title");
  const handymanId = params.get("handyman");
  const handymanName = params.get("name");
  const service = params.get("service");

  try {
    let conversationId = null;

    if (jobId && customerId && jobTitle) {
      console.log("Creating job conversation:", {
        jobId,
        customerId,
        jobTitle,
      });
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUserId: customerId,
          jobId,
          initialMessage: `Hi! I'm interested in your job posting: "${jobTitle}". I'd like to discuss the details and provide a quote.`,
        }),
      });
      const data = await response.json();
      if (data.success) {
        conversationId = data.conversationId;
        console.log("Job conversation result:", data.message);
      } else {
        console.error("Failed to create job conversation:", data.error);
      }
    } else if (handymanId && handymanName) {
      const intent = params.get("intent"); // ✅ new

      console.log("Creating handyman conversation:", {
        handymanId,
        handymanName,
        intent,
      });

      // ✅ Different initial message if it's a quote request
      const initialMessage =
        intent === "quote"
          ? `Hi ${handymanName}, I’d like to request a quote for ${
              service || "a project"
            }. Can you provide details?`
          : `Hi ${handymanName}! I'd like to discuss a ${
              service || "project"
            } and get a quote.`;

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUserId: handymanId,
          initialMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        conversationId = data.conversationId;
        console.log("Handyman conversation result:", data.message);
      } else {
        console.error("Failed to create handyman conversation:", data.error);
      }
    }

    if (conversationId) {
      await loadMessages(conversationId);
    }

    return true;
  } catch (error) {
    console.error("Failed to process URL parameters:", error);
    return false;
  }
};

// ✅ Your original useEffect - unchanged
useEffect(() => {
  const initialize = async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const hasURLParams =
      window.location.search.includes("job") ||
      window.location.search.includes("handyman");

    if (hasURLParams) {
      const processed = await processURLParameters();
      if (!processed) {
        await loadConversations();
      }
    } else {
      await loadConversations();
    }

    await loadConversations();
    setLoading(false);
  };

  initialize();

  return () => {
    const currentURL = window.location.search;
    const urlKey = `processed_${currentURL}`;
    sessionStorage.removeItem(urlKey);
  };
}, []);

// ✅ Cleanup Socket.io on unmount
useEffect(() => {
  return () => {
    if (selectedConversationId) {
      leaveConversation(selectedConversationId);
      stopTyping(selectedConversationId);
    }
  };
}, [selectedConversationId, leaveConversation, stopTyping]);

const sendMessage = async () => {
  if (!newMessage.trim() || !selectedConversationId || sending) return;

  setSending(true);
  const messageContent = newMessage.trim();
  setNewMessage(""); // Clear input immediately

  try {
    // Stop typing indicator
    stopTyping(selectedConversationId);

    // Always create a tempId for optimistic message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Add optimistic message immediately
    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      conversationId: selectedConversationId, // ✅ now included
      senderId: session?.user?.id || "",
      senderName: "You",
      content: messageContent,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      isRead: true,
      canEdit: true,
      canDelete: true,
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    // Call backend to persist message
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selectedConversationId,
        content: messageContent,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? {
                ...data.message,
                conversationId: selectedConversationId, // ✅ keep consistency
                canEdit: true,
                canDelete: true,
                isOptimistic: false,
              }
            : msg
        )
      );

      loadConversations(); // Refresh last message
    } else {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      setNewMessage(messageContent); // Restore message in input
    }
  } catch (error) {
    console.error("Failed to send message:", error);
    setNewMessage(messageContent); // Restore message in input
  }

  setSending(false);
};

// ✅ Handle typing with Socket.io
const handleInputChange = (value: string) => {
  setNewMessage(value);

  if (selectedConversationId && isConnected) {
    if (value.trim()) {
      startTyping(selectedConversationId);
    } else {
      stopTyping(selectedConversationId);
    }
  }
};

const handleInputBlur = () => {
  if (selectedConversationId && isConnected) {
    stopTyping(selectedConversationId);
  }
};

// ✅ Your original edit and delete functions - unchanged
const editMessage = async (messageId: string) => {
  if (!editContent.trim()) return;

  try {
    const response = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, content: editContent }),
    });

    const data = await response.json();
    if (data.success) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: data.message.content,
                timestamp: data.message.timestamp,
              }
            : msg
        )
      );
      setEditingId(null);
      setEditContent("");
    }
  } catch (error) {
    console.error("Failed to edit message:", error);
  }
};

const deleteMessage = async (messageId: string) => {
  if (!confirm("Delete this message?")) return;

  try {
    const response = await fetch(`/api/messages?messageId=${messageId}`, {
      method: "DELETE",
    });

    const data = await response.json();
    if (data.success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      loadConversations();
    }
  } catch (error) {
    console.error("Failed to delete message:", error);
  }
};

const deleteConversation = async (conversationId: string) => {
  if (!confirm("Delete entire conversation? This cannot be undone.")) return;

  try {
    const response = await fetch(
      `/api/conversations?conversationId=${conversationId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();
    if (data.success) {
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    }
  } catch (error) {
    console.error("Failed to delete conversation:", error);
  }
};

// ✅ Your original derived state - unchanged
const selectedConversation = conversations.find(
  (c) => c.id === selectedConversationId
);
const otherParticipant = selectedConversation?.participants.find(
  (p) => p.id !== session?.user?.id
);

// ✅ Your original loading UI - unchanged
if (loading) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Loading messages...</p>
      </div>
    </div>
  );
}

return (
  <div className="min-h-[calc(100vh-5rem)] bg-orange-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* ✅ Your original conversations list with online status indicators */}
        <div className="lg:col-span-4 bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-orange-100">
                  Stay connected with your neighborhood pros
                </p>
              </div>
              {/* connection status indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-400" : "bg-red-400"
                  }`}
                ></div>
                <span className="text-xs">
                  {isConnected ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  No messages yet
                </h3>
                <p className="text-slate-600 text-sm">
                  Start browsing handymen to begin conversations
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {conversations.map((conversation) => {
                  const otherPerson = conversation.participants.find(
                    (p) => p.id !== session?.user?.id
                  );
                  const isOnline = onlineUsers.includes(otherPerson?.id || ""); // ✅ Check online status

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => loadMessages(conversation.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 relative group ${
                        selectedConversationId === conversation.id
                          ? "bg-orange-100 border-orange-300 border-2"
                          : "hover:bg-slate-50 border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* ✅ Add online indicator to avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold">
                              {otherPerson?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          {isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-800 truncate">
                              {otherPerson?.name}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {conversation.lastMessage?.timestamp}
                            </span>
                          </div>

                          {conversation.jobContext && (
                            <div className="text-xs text-blue-600 mb-1">
                              💼 {conversation.jobContext.jobTitle}
                            </div>
                          )}

                          <p className="text-sm text-slate-600 truncate">
                            {conversation.lastMessage?.content ||
                              "No messages yet"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="absolute top-[-15px] -right-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-200 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="Delete conversation"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ✅ Your original chat area with typing indicators */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden flex flex-col">
          {selectedConversationId ? (
            <>
              {/* ✅ Your original chat header with online status */}
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">
                          {otherParticipant?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      {onlineUsers.includes(otherParticipant?.id || "") && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        {otherParticipant?.name}
                      </h2>
                      <p className="text-slate-500 capitalize">
                        {otherParticipant?.role}
                        {onlineUsers.includes(otherParticipant?.id || "") && (
                          <span className="text-green-600 ml-2">• Online</span>
                        )}
                      </p>

                      {selectedConversation?.jobContext && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <span className="font-semibold text-blue-800">
                            💼 Job:
                          </span>
                          <span className="text-blue-700 ml-1">
                            {selectedConversation.jobContext.jobTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteConversation(selectedConversationId)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* ✅ Your original messages area with optimistic updates */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === session?.user?.id;
                  const isEditing = editingId === message.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group ${
                          isOwn
                            ? `bg-orange-500 text-white ${
                                message.isOptimistic ? "opacity-70" : ""
                              }`
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 text-sm bg-white text-slate-800 rounded resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => editMessage(message.id)}
                                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditContent("");
                                }}
                                className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm leading-relaxed">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p
                                className={`text-xs ${
                                  isOwn ? "text-orange-100" : "text-slate-500"
                                }`}
                              >
                                {message.timestamp}
                              </p>
                              {message.isOptimistic && (
                                <span className="text-xs text-orange-200">
                                  Sending...
                                </span>
                              )}
                            </div>

                            {isOwn &&
                              (message.canEdit || message.canDelete) && (
                                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex gap-1 bg-white rounded shadow-lg border p-1">
                                    {message.canEdit && (
                                      <button
                                        onClick={() => {
                                          setEditingId(message.id);
                                          setEditContent(message.content);
                                        }}
                                        className="p-1 text-slate-600 hover:text-blue-600 rounded text-xs"
                                        title="Edit"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                    {message.canDelete && (
                                      <button
                                        onClick={() =>
                                          deleteMessage(message.id)
                                        }
                                        className="p-1 text-slate-600 hover:text-red-600 rounded text-xs"
                                        title="Delete"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* ✅ Add typing indicators */}
                {currentTypingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs">
                          {currentTypingUsers
                            .map((user) => user.userName)
                            .join(", ")}{" "}
                          typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Your original message input with typing integration */}
              <div className="border-t border-slate-200 p-6">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onBlur={handleInputBlur}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 px-6 py-3 rounded-xl"
                  >
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-amber-600 mt-2">
                    Real-time messaging offline - messages will still be
                    delivered
                  </p>
                )}
              </div>
            </>
          ) : (
            // ✅ Your original empty state - unchanged
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Select a conversation
                </h3>
                <p className="text-slate-600">
                  Choose a conversation from the left to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
