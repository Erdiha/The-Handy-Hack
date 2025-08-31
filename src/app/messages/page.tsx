"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRealTimeMessages } from "@/hooks/useRealTimeMessages";
import { useNotifications } from "@/contexts/NotificationContext";

// Online Status Indicator Component
interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

function OnlineStatusIndicator({
  isOnline,
  size = "sm",
  showText = false,
  className = "",
}: OnlineStatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
          animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
          transition={isOnline ? { duration: 2, repeat: Infinity } : {}}
        />
        {isOnline && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-400`}
            animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {showText && (
        <span
          className={`text-xs font-medium ${
            isOnline ? "text-green-600" : "text-gray-500"
          }`}
        >
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}

// PROPER TYPESCRIPT INTERFACES
interface Participant {
  id: string;
  name: string;
  role: "customer" | "handyman";
}

interface LastMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface JobContext {
  jobId: string;
  jobTitle: string;
  category?: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: LastMessage | null;
  isActive: boolean;
  jobContext?: JobContext;
  unreadCount: number;
}

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
  createdAt?: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const { refreshNotifications, setActiveConversation } = useNotifications();

  // CLEAN STATE MANAGEMENT
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Refs for cleanup and scroll
  const initializedRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasOnlineRef = useRef<{ [key: string]: boolean | null }>({});

  const forceScrollToBottom = useCallback((smooth = true) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const container = messagesContainerRef.current;
    if (!container) return;

    const smoothScroll = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    };

    // Immediate scroll
    smoothScroll();

    // Additional attempts for initial load
    scrollTimeoutRef.current = setTimeout(() => {
      smoothScroll();
    }, 0);
  }, []);

  // Toast notification helper
  const showStatusToast = useCallback((message: string, isOnline: boolean) => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
      isOnline ? "bg-green-500" : "bg-gray-500"
    }`;
    toast.style.opacity = "0";
    toast.textContent = message;

    document.body.appendChild(toast);

    // Fade in
    setTimeout(() => (toast.style.opacity = "1"), 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }, []);

  const {
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage: socketSendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
  } = useRealTimeMessages({
    conversationId: selectedConversationId,
    onNewMessage: useCallback(
      async (message: Message) => {
        console.log("📨 Received real-time message:", message);

        const newMsg: Message = {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
          isRead: message.isRead,
          canEdit: message.senderId === session?.user?.id,
          canDelete: message.senderId === session?.user?.id,
          isOptimistic: false,
          createdAt: message.createdAt || new Date().toISOString(),
        };

        // Add message to UI
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === newMsg.id);
          if (exists) return prev;
          return [...prev, newMsg].slice(-50);
        });

        // CRITICAL FIX: If viewing this conversation, mark as read immediately
        if (message.conversationId === selectedConversationId) {
          console.log(
            "🔔 Auto-marking new message as read - user viewing conversation"
          );

          try {
            await fetch("/api/notifications/mark-conversation-read", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId: message.conversationId }),
            });

            // Refresh notifications after marking as read
            await refreshNotifications();
          } catch (error) {
            console.error("Failed to mark message as read:", error);
          }
        }

        loadConversations();
      },
      [selectedConversationId, session?.user?.id, refreshNotifications]
    ),
    onMessageEdit: (editData) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editData.messageId
            ? {
                ...msg,
                content: editData.newContent,
                timestamp: editData.timestamp,
              }
            : msg
        )
      );
    },
  });

  // CONSOLIDATED SCROLL EFFECTS
  useEffect(() => {
    if (messages.length > 0 || typingUsers.length > 0) {
      forceScrollToBottom();
    }
  }, [messages.length, typingUsers.length, forceScrollToBottom]);

  // Additional scroll for conversation changes
  useEffect(() => {
    if (selectedConversationId && messages.length > 0 && !messagesLoading) {
      // Multiple attempts for initial load with increasing delays
      setTimeout(() => forceScrollToBottom(false), 0);
      setTimeout(() => forceScrollToBottom(true), 100);
      setTimeout(() => forceScrollToBottom(true), 300);
    }
  }, [selectedConversationId, messagesLoading, forceScrollToBottom]);

  // Page visibility detection for immediate disconnect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("🙈 User went to background");
      } else {
        console.log("👀 User came back to foreground");
      }
    };

    const handleBeforeUnload = () => {
      // User is closing the page - disconnect immediately
      if (window.globalSocket) {
        window.globalSocket.disconnect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // CLEAR ACTIVE CONVERSATION WHEN LEAVING MESSAGES PAGE
  useEffect(() => {
    return () => {
      console.log("🧹 Messages page unmounting - clearing active conversation");
      setActiveConversation(null);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [setActiveConversation]);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // SIMPLE CONVERSATION LOADING
  const loadConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();

      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("❌ Network Error loading conversations:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setMessagesLoading(true);

    try {
      // Leave previous conversation
      if (selectedConversationId && selectedConversationId !== conversationId) {
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

        // Join conversation
        joinConversation(conversationId);
        setActiveConversation(String(conversationId));

        await fetch("/api/notifications/mark-conversation-read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });

        // NOW refresh notifications to update counts
        await refreshNotifications();

        await loadConversations();

        console.log(
          "✅ Conversation opened and marked as read:",
          conversationId
        );
      }
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Handle conversation refresh from notifications
  useEffect(() => {
    const handleConversationRefresh = () => {
      console.log("🔄 Refreshing conversations due to notification update");
      loadConversations();
    };

    window.addEventListener(
      "conversation_list_refresh",
      handleConversationRefresh
    );
    return () => {
      window.removeEventListener(
        "conversation_list_refresh",
        handleConversationRefresh
      );
    };
  }, []);

  // SINGLE NEW MESSAGE HANDLER (removed duplicate)
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = window.globalSocket;
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      console.log("New message received:", message.conversationId);
      console.log("Currently viewing:", selectedConversationId);

      // If no conversation is selected OR viewing different conversation, refresh list
      if (
        !selectedConversationId ||
        message.conversationId !== selectedConversationId
      ) {
        console.log("Refreshing conversation list for unread indicator");
        loadConversations();
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedConversationId, session?.user?.id]);

  // Online status change notifications
  useEffect(() => {
    conversations.forEach((conversation) => {
      const otherPerson = conversation.participants.find(
        (p) => p.id !== session?.user?.id
      );

      if (!otherPerson?.id) return;

      const isCurrentlyOnline = onlineUsers.includes(otherPerson.id);
      const wasOnline = wasOnlineRef.current[otherPerson.id];

      // Only show notification after initial load and when status actually changes
      if (wasOnline !== null && wasOnline !== isCurrentlyOnline) {
        const message = isCurrentlyOnline
          ? `${otherPerson.name} is now online`
          : `${otherPerson.name} went offline`;

        showStatusToast(message, isCurrentlyOnline);
      }

      wasOnlineRef.current[otherPerson.id] = isCurrentlyOnline;
    });
  }, [onlineUsers, conversations, session?.user?.id, showStatusToast]);

  // URL PARAMETER HANDLING
  const handleContactNowFlow = async () => {
    const params = new URLSearchParams(window.location.search);
    const handymanId = params.get("handyman");
    const handymanName = params.get("name");
    const service = params.get("service");

    if (!handymanId || !handymanName) return false;

    try {
      const initialMessage = `Hi ${handymanName}! I'd like to discuss a ${
        service || "project"
      } and get a quote.`;

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUserId: handymanId,
          initialMessage,
          serviceContext: service,
        }),
      });

      const data = await response.json();
      if (!data.success) return false;

      await loadConversations();
      await loadMessages(data.conversationId);
      window.history.replaceState({}, "", "/messages");

      return true;
    } catch (error) {
      console.error("💥 Error in Contact Now flow:", error);
      return false;
    }
  };

  // INITIALIZATION
  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current || !session?.user?.id) return;
      initializedRef.current = true;

      const hasHandymanParams = window.location.search.includes("handyman");

      if (hasHandymanParams) {
        const success = await handleContactNowFlow();
        if (!success) await loadConversations();
      } else {
        await loadConversations();
      }

      setLoading(false);
    };

    initialize();
  }, [session?.user?.id]);

  // MESSAGE SENDING
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      stopTyping(selectedConversationId);

      // Optimistic message
      const tempId = `temp-${Date.now()}`;
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
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Send to API
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
        // Replace optimistic with real
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? {
                  ...data.message,
                  conversationId: selectedConversationId,
                  canEdit: true,
                  canDelete: true,
                  isOptimistic: false,
                  createdAt: data.message.createdAt || new Date().toISOString(),
                }
              : msg
          )
        );

        // Socket broadcast
        socketSendMessage(selectedConversationId, messageContent);
        loadConversations();
      } else {
        setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setNewMessage(messageContent);
    }

    setSending(false);
  };

  // DELETE CONVERSATION
  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Delete this conversation? This action cannot be undone."))
      return;

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
          setActiveConversation(null);
        }
      } else {
        alert("Failed to delete conversation: " + data.error);
      }
    } catch (error) {
      alert("Failed to delete conversation");
    }
  };

  // EDIT HELPERS
  const canEditMessage = (message: Message): boolean => {
    if (message.senderId !== session?.user?.id) return false;
    if (message.isOptimistic) return true;

    if (message.createdAt) {
      const messageAge =
        new Date().getTime() - new Date(message.createdAt).getTime();
      return messageAge <= 60 * 60 * 1000; // 1 hour
    }
    return false;
  };

  const startEdit = (message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === editingId
          ? {
              ...msg,
              content: editContent.trim(),
              timestamp: `${new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })} (edited)`,
            }
          : msg
      )
    );

    cancelEdit();

    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: editingId,
          content: editContent.trim(),
        }),
      });
    } catch (error) {
      console.error("❌ Edit failed:", error);
    }
  };

  // TYPING
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // DELETE MESSAGE
  const deleteMessage = async (message: Message) => {
    if (!confirm("Delete this message? This action cannot be undone.")) return;

    try {
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));

      const response = await fetch(
        `/api/messages?messageId=${message.id}&deleteType=everyone`,
        { method: "DELETE", headers: { "Content-Type": "application/json" } }
      );

      const data = await response.json();

      if (!data.success) {
        alert("Failed to delete message: " + data.error);
        if (selectedConversationId) {
          loadMessages(selectedConversationId);
        }
      }
    } catch (error) {
      alert("Failed to delete message");
      if (selectedConversationId) {
        loadMessages(selectedConversationId);
      }
    }
  };

  const currentTypingUsers = typingUsers.filter(
    (user) =>
      user.conversationId === selectedConversationId &&
      user.userId !== session?.user?.id
  );

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );
  const otherParticipant = selectedConversation?.participants.find(
    (p) => p.id !== session?.user?.id
  );

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
          {/* LEFT: Conversations List */}
          <motion.div
            className={`${
              isMobile && selectedConversationId ? "hidden" : "block"
            } lg:col-span-4 bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-orange-200 overflow-hidden`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
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
                    const isSelected =
                      selectedConversationId === conversation.id;
                    const isJobConversation = !!conversation.jobContext;

                    return (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(index * 0.05, 0.3),
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                        whileHover={{
                          y: -1,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                        onClick={() => loadMessages(conversation.id)}
                        className={`mx-2 mb-2 p-4 rounded-lg cursor-pointer transition-all duration-200 border group ${
                          isSelected
                            ? "bg-orange-50 border-orange-300 shadow-sm"
                            : "bg-white hover:bg-slate-25 border-slate-100 hover:border-slate-200 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex space-x-3">
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-sm ${
                                isJobConversation
                                  ? "bg-blue-600"
                                  : "bg-slate-600"
                              }`}
                            >
                              <span className="text-white font-semibold text-sm uppercase">
                                {otherPerson?.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>

                            {/* Enhanced online indicator */}
                            <div className="absolute -bottom-1 -right-1">
                              <OnlineStatusIndicator
                                isOnline={isOnline}
                                size="md"
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 relative">
                              <h3 className="font-semibold text-sm truncate text-slate-800">
                                {otherPerson?.name}
                                <span className="text-xs text-slate-400 capitalize italic font-normal ml-1">
                                  - {otherPerson?.role}
                                </span>
                              </h3>

                              {/* Simple red dot indicator */}
                              {conversation.unreadCount > 0 && (
                                <div className="w-3 h-3 absolute -top-[20px] -right-[20px] bg-red-500 rounded-full"></div>
                              )}
                            </div>
                            <div className="mb-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                  isJobConversation
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-gray-50 text-gray-700 border border-gray-200"
                                }`}
                              >
                                <span className="mr-1">
                                  {isJobConversation ? "🔧" : "💬"}
                                </span>
                                {isJobConversation
                                  ? `Job: ${conversation.jobContext!.jobTitle}`
                                  : "General Chat"}
                              </span>
                            </div>

                            <p className="text-sm text-slate-600">
                              {conversation.lastMessage?.content ? (
                                conversation.lastMessage.content.length > 50 ? (
                                  `${conversation.lastMessage.content.substring(
                                    0,
                                    50
                                  )}...`
                                ) : (
                                  conversation.lastMessage.content
                                )
                              ) : (
                                <span className="text-slate-400 italic">
                                  Start a conversation...
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="absolute top-2 right-2 cursor-pointer p-1.5 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg hover:bg-red-50"
                          title="Delete conversation"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Chat Area */}
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
                <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4">
                  <div className="flex items-center space-x-4">
                    {isMobile && (
                      <button
                        onClick={() => {
                          setSelectedConversationId(null);
                          setActiveConversation(null);
                        }}
                        className="p-1 text-slate-600 hover:text-slate-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                    )}

                    <div className="relative">
                      <div className="w-11 h-11 bg-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {otherParticipant?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      {onlineUsers.includes(otherParticipant?.id || "") && (
                        <div className="absolute bottom-0 right-0">
                          <OnlineStatusIndicator isOnline={true} size="sm" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        {otherParticipant?.name}
                        <OnlineStatusIndicator
                          isOnline={onlineUsers.includes(
                            otherParticipant?.id || ""
                          )}
                          size="md"
                        />
                      </h2>
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <span className="capitalize">
                          {otherParticipant?.role}
                        </span>

                        <span>•</span>
                        <OnlineStatusIndicator
                          isOnline={onlineUsers.includes(
                            otherParticipant?.id || ""
                          )}
                          showText={true}
                          size="sm"
                        />

                        {currentTypingUsers.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600">typing...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedConversation?.jobContext && (
                    <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg border-l-3 border-blue-500">
                      <p className="text-sm text-blue-700 font-medium">
                        🔧 {selectedConversation.jobContext.jobTitle}
                      </p>
                    </div>
                  )}
                </div>

                {/* Messages Area - CRITICAL: Fixed container for scroll */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 bg-gradient-to-b from-orange-25 to-white"
                >
                  {messagesLoading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="font-semibold text-slate-800 mb-2">
                        No messages yet
                      </h3>
                      <p className="text-slate-600">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwn = message.senderId === session?.user?.id;
                      const isEditing = editingId === message.id;
                      const canEdit = canEditMessage(message);

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
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
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="w-full p-2 text-sm bg-white text-slate-800 rounded-lg resize-none border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  rows={2}
                                  autoFocus
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      saveEdit();
                                    }
                                    if (e.key === "Escape") {
                                      cancelEdit();
                                    }
                                  }}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={saveEdit}
                                    className="text-xs px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
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
                                      isOwn
                                        ? "text-orange-100"
                                        : "text-slate-500"
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

                                {isOwn && (canEdit || message.canDelete) && (
                                  <div className="absolute -top-8 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <div className="flex gap-1 bg-white rounded-lg shadow-lg border p-1">
                                      {canEdit && (
                                        <button
                                          onClick={() => startEdit(message)}
                                          className="p-1 text-slate-600 hover:text-blue-600 rounded text-xs transition-colors"
                                          title="Edit message"
                                        >
                                          ✏️
                                        </button>
                                      )}
                                      {message.canDelete && (
                                        <button
                                          onClick={() => deleteMessage(message)}
                                          className="p-1 text-slate-600 hover:text-red-600 rounded text-xs transition-colors"
                                          title="Delete message"
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
                    })
                  )}

                  {/* Typing Indicators */}
                  <AnimatePresence>
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
                  </AnimatePresence>
                </div>

                {/* Message Input */}
                <div className="border-t border-slate-200 p-4 lg:p-6 bg-gradient-to-r from-white to-orange-50">
                  <div className="flex space-x-3 lg:space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
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
