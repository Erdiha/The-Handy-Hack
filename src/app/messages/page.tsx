"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRealTimeMessages } from "@/hooks/useRealTimeMessages";
import { io } from "socket.io-client";

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

  // State management
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
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const initializedRef = useRef(false);
  const urlProcessedRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // **SEAMLESS SCROLL SYSTEM**
  const isAtBottomRef = useRef(true);
  const scrollObserverRef = useRef<IntersectionObserver | null>(null);
  const bottomElementRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Use requestAnimationFrame for ultra-smooth scrolling
    requestAnimationFrame(() => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        50;

      if (force || isAtBottomRef.current || isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  }, []);

  // Track if user is at bottom using Intersection Observer
  useEffect(() => {
    if (!bottomElementRef.current) return;

    scrollObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        isAtBottomRef.current = entry.isIntersecting;
      },
      {
        root: messagesContainerRef.current,
        threshold: 0.1,
        rootMargin: "0px 0px 20px 0px",
      }
    );

    scrollObserverRef.current.observe(bottomElementRef.current);

    return () => {
      if (scrollObserverRef.current) {
        scrollObserverRef.current.disconnect();
      }
    };
  }, [selectedConversationId]);

  // Track user manual scrolling
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    isUserScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 100);
  }, []);

  // Auto-scroll on ANY content change
  useEffect(() => {
    if (messages.length === 0) return;

    const timer = setTimeout(() => {
      if (!isUserScrollingRef.current) {
        scrollToBottom(false);
      }
    }, 10); // Very fast response

    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Force scroll when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      setTimeout(() => {
        isAtBottomRef.current = true;
        scrollToBottom(true);
      }, 50);
    }
  }, [selectedConversationId, scrollToBottom]);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Socket.io and real-time messaging
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log("Authenticating user:", session.user.id, session.user.name);

    const socket = io();

    socket.on("connect", () => {
      console.log("✅ Socket.io connected:", socket.id);

      socket.emit("authenticate", {
        userId: session.user.id,
        userName: session.user.name,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id]);

  const {
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage: socketSendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    startPolling,
    stopPolling,
  } = useRealTimeMessages({
    conversationId: selectedConversationId,
    onNewMessage: useCallback(
      (message: Message) => {
        const newMsg: Message = {
          id: message.id,
          conversationId: message.conversationId,
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

  const currentTypingUsers = typingUsers.filter(
    (user) =>
      user.conversationId === selectedConversationId &&
      user.userId !== session?.user?.id
  );

  // FORCE scroll for typing indicators
  useEffect(() => {
    if (currentTypingUsers.length > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        // Instant scroll to bottom when typing appears
        container.scrollTop = container.scrollHeight;

        // Backup scroll after short delay
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    }
  }, [currentTypingUsers.length]);

  // Load conversations
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

  // Load messages
  const loadMessages = async (conversationId: string) => {
    try {
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
        joinConversation(conversationId);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  // Process URL parameters
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
        const isCompleted = params.get("completed") === "true";

        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            otherUserId: customerId,
            jobId,
          }),
        });
        const data = await response.json();
        if (data.success) {
          conversationId = data.conversationId;
        }
      } else if (handymanId && handymanName) {
        const intent = params.get("intent");

        const initialMessage =
          intent === "quote"
            ? `Hi ${handymanName}, I'd like to request a quote for ${
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

  // Initialize
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (selectedConversationId) {
        leaveConversation(selectedConversationId);
        stopTyping(selectedConversationId);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [selectedConversationId, leaveConversation, stopTyping]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      stopTyping(selectedConversationId);

      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      const optimisticMessage: Message = {
        id: tempId,
        tempId,
        conversationId: selectedConversationId,
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

      // Add optimistic message
      setMessages((prev) => [...prev, optimisticMessage]);

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
                  conversationId: selectedConversationId,
                  canEdit: true,
                  canDelete: true,
                  isOptimistic: false,
                }
              : msg
          )
        );

        socketSendMessage(selectedConversationId, messageContent);
        loadConversations();
      } else {
        setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageContent);
    }

    setSending(false);
  };

  // Handle typing
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Edit and delete functions
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

  // Derived state
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );
  const otherParticipant = selectedConversation?.participants.find(
    (p) => p.id !== session?.user?.id
  );

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading your messages...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8">
        <div className="grid lg:grid-cols-12 gap-2 lg:gap-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <motion.div
            className={`${
              isMobile && selectedConversationId ? "hidden" : "block"
            } lg:col-span-4 bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-orange-200 overflow-hidden`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 lg:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold">Messages</h1>
                  <p className="text-orange-100 text-sm lg:text-base">
                    Stay connected with your neighborhood pros
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.div
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? "bg-green-400" : "bg-red-400"
                    }`}
                    animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium">
                    {isConnected ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Conversations */}
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <motion.div
                  className="p-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    No messages yet
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Start browsing handymen to begin conversations
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-1 p-2 lg:p-4">
                  {conversations.map((conversation, index) => {
                    const otherPerson = conversation.participants.find(
                      (p) => p.id !== session?.user?.id
                    );
                    const isOnline = onlineUsers.includes(
                      otherPerson?.id || ""
                    );

                    return (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01, duration: 0.4 }}
                        whileHover={{
                          y: -2,
                          boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                        }}
                        whileTap={{ y: 0 }}
                        onClick={() => loadMessages(conversation.id)}
                        className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl cursor-pointer transition-all duration-300 relative group ${
                          selectedConversationId === conversation.id
                            ? "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 border-2 shadow-lg"
                            : "hover:bg-gradient-to-r hover:from-slate-50 hover:to-white border-2 border-transparent hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                              <span className="text-white font-bold text-sm lg:text-base">
                                {otherPerson?.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 border-2 border-white rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-slate-800 truncate text-sm lg:text-base">
                                {otherPerson?.name}
                              </h3>
                              <span className="text-xs text-slate-500">
                                {conversation.lastMessage?.timestamp}
                              </span>
                            </div>

                            {conversation.jobContext && (
                              <div className="text-xs text-blue-600 mb-1 font-medium">
                                💼 {conversation.jobContext.jobTitle}
                              </div>
                            )}

                            <p className="text-xs lg:text-sm text-slate-600 truncate">
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
                          className="absolute top-[-8px] -right-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Delete conversation"
                        >
                          ×
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Chat Area */}
          <motion.div
            className={`${
              isMobile && !selectedConversationId ? "hidden" : "block"
            } lg:col-span-8 bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-orange-200 overflow-hidden flex flex-col`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {selectedConversationId ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-slate-200 p-4 lg:p-6 bg-gradient-to-r from-white to-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      {isMobile && (
                        <button
                          onClick={() => setSelectedConversationId(null)}
                          className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          ←
                        </button>
                      )}

                      <div className="relative">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-sm lg:text-base">
                            {otherParticipant?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        {onlineUsers.includes(otherParticipant?.id || "") && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div>
                        <h2 className="text-lg lg:text-xl font-bold text-slate-800">
                          {otherParticipant?.name}
                        </h2>
                        <div className="flex items-center space-x-2">
                          <p className="text-slate-500 capitalize text-sm">
                            {otherParticipant?.role}
                          </p>
                          {onlineUsers.includes(otherParticipant?.id || "") && (
                            <span className="text-green-600 text-xs font-medium">
                              • Online
                            </span>
                          )}
                        </div>

                        {selectedConversation?.jobContext && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
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

                {/* Messages Area with PROPER SCROLL */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 bg-gradient-to-b from-orange-25 to-white"
                  style={{
                    scrollBehavior: "smooth",
                    overflowAnchor: "none",
                  }}
                >
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === session?.user?.id;
                    const isEditing = editingId === message.id;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 lg:px-4 py-2 lg:py-3 rounded-2xl relative group transition-all duration-200 ${
                            isOwn
                              ? `bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg ${
                                  message.isOptimistic ? "opacity-70" : ""
                                }`
                              : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-800 shadow-md"
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-2 text-sm bg-white text-slate-800 rounded-lg resize-none border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editMessage(message.id)}
                                  className="text-xs px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditContent("");
                                  }}
                                  className="text-xs px-3 py-1 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm lg:text-base leading-relaxed break-words">
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
                                  <span className="text-xs text-orange-200 ml-2">
                                    Sending...
                                  </span>
                                )}
                              </div>

                              {isOwn &&
                                (message.canEdit || message.canDelete) && (
                                  <div className="absolute -top-8 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <div className="flex gap-1 bg-white rounded-lg shadow-lg border p-1">
                                      {message.canEdit && (
                                        <button
                                          onClick={() => {
                                            setEditingId(message.id);
                                            setEditContent(message.content);
                                          }}
                                          className="p-1 text-slate-600 hover:text-blue-600 rounded text-xs transition-colors"
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
                                          className="p-1 text-slate-600 hover:text-red-600 rounded text-xs transition-colors"
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
                      </motion.div>
                    );
                  })}

                  {/* Typing Indicators */}
                  {currentTypingUsers.length > 0 && (
                    <motion.div
                      className="flex justify-start"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 px-4 py-3 rounded-2xl shadow-md">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-slate-400 rounded-full"
                                animate={{
                                  y: [0, -8, 0],
                                  opacity: [0.4, 1, 0.4],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium">
                            {currentTypingUsers
                              .map((user) => user.userName)
                              .join(", ")}{" "}
                            typing...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-slate-200 p-4 lg:p-6 bg-gradient-to-r from-white to-orange-50">
                  <div className="flex space-x-3 lg:space-x-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onBlur={handleInputBlur}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white shadow-sm text-sm lg:text-base"
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-300 disabled:to-slate-400 px-4 lg:px-6 py-3 rounded-xl lg:rounded-2xl text-white font-medium shadow-lg transition-all duration-200"
                    >
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>

                  {!isConnected && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      ⚠️ Real-time messaging offline - messages will still be
                      delivered
                    </p>
                  )}
                </div>
              </>
            ) : (
              // Empty State
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-orange-25 to-white">
                <div className="text-center">
                  <div className="text-6xl lg:text-8xl mb-6">💬</div>
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-3">
                    Select a conversation
                  </h3>
                  <p className="text-slate-600 text-sm lg:text-base">
                    Choose a conversation from the left to start messaging
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
