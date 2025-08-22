"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRealTimeMessages } from "@/hooks/useRealTimeMessages";
import { io } from "socket.io-client";
import { DeleteMessageModal } from "@/components/modals/MessageDeleteModal";
import { useNotifications } from "@/contexts/NotificationContext";
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

interface ApiMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt?: string;
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
  const [isMobile, setIsMobile] = useState(false);

  // Delete message states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Refs
  const initializedRef = useRef(false);
  const urlProcessedRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);
  const { refreshNotifications, setActiveConversation } = useNotifications();
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-scroll when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedConversationId, scrollToBottom]);

  // **TIME LIMIT CHECKS**
  const getMessageAge = (message: Message) => {
    if (message.isOptimistic) return 0;

    if (message.createdAt) {
      return new Date().getTime() - new Date(message.createdAt).getTime();
    } else if (message.timestamp.includes("T")) {
      return new Date().getTime() - new Date(message.timestamp).getTime();
    }

    return 0;
  };

  const canEditMessage = (message: Message) => {
    if (message.senderId !== session?.user?.id) return false;
    if (message.isOptimistic) return true;

    const messageAge = getMessageAge(message);
    const oneHour = 60 * 60 * 1000;
    return messageAge <= oneHour;
  };

  const canDeleteMessage = (message: Message) => {
    if (message.senderId !== session?.user?.id) return false;
    return true;
  };

  const canDeleteForEveryone = (message: Message) => {
    if (message.senderId !== session?.user?.id) return false;
    if (message.isOptimistic) return true;

    const messageAge = getMessageAge(message);
    const oneHour = 60 * 60 * 1000;
    return messageAge <= oneHour;
  };

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Socket.io connection
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io();

    socket.on("connect", () => {
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
  } = useRealTimeMessages({
    conversationId: selectedConversationId,
    onNewMessage: useCallback(
      (message: Message) => {
        // Handle deletion messages
        if (message.content.startsWith("__MESSAGE_DELETED_FOR_EVERYONE__")) {
          const deletedMessageId = message.content.replace(
            "__MESSAGE_DELETED_FOR_EVERYONE__",
            ""
          );
          setMessages((prev: Message[]) =>
            prev.filter((msg) => msg.id !== deletedMessageId)
          );
          return;
        }

        // Regular message handling
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
          tempId: message.tempId,
          isOptimistic: false,
          createdAt: message.createdAt || new Date().toISOString(),
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

  // Auto-scroll when typing indicators appear
  useEffect(() => {
    if (currentTypingUsers.length > 0) {
      scrollToBottom();
    }
  }, [currentTypingUsers.length, scrollToBottom]);

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
        setActiveConversation(conversationId);
        // Mark notifications as read for this conversation
        await fetch("/api/notifications/mark-conversation-read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });

        // Refresh notification counts
        refreshNotifications();
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
        await loadConversations();
        setTimeout(async () => {
          await loadMessages(conversationId);
        }, 300);
        return true;
      }

      return false;
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
        await processURLParameters();
      } else {
        await loadConversations();
      }

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
        createdAt: new Date().toISOString(),
      };

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
                  createdAt: data.message.createdAt || new Date().toISOString(),
                }
              : msg
          )
        );

        socketSendMessage(selectedConversationId, messageContent);
        const socket = window.globalSocket;
        if (socket) {
          socket.emit("notification_update", {
            userId: otherParticipant?.id,
            conversationId: selectedConversationId,
            type: "message",
          });
        }

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

  // Edit message
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

  // Delete message - Updated to handle hiding vs full deletion
  const deleteMessage = async (
    messageId: string,
    deleteType: "me" | "everyone"
  ) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        alert("Message not found");
        setDeleteModalOpen(false);
        setMessageToDelete(null);
        return;
      }

      if (deleteType === "everyone" && !canDeleteForEveryone(message)) {
        alert("You can only delete for everyone within 1 hour of sending");
        setDeleteModalOpen(false);
        setMessageToDelete(null);
        return;
      }

      const response = await fetch(`/api/messages?messageId=${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteType }),
      });

      const data = await response.json();
      if (data.success) {
        // Always remove from current user's view
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        // If deleted for everyone, broadcast the deletion
        if (data.broadcastDeletion && selectedConversationId) {
          socketSendMessage(
            selectedConversationId,
            `__MESSAGE_DELETED_FOR_EVERYONE__${messageId}`
          );
        }

        // Update conversation list
        loadConversations();

        console.log(
          "✅ Message deletion:",
          data.deletedForEveryone ? "Complete" : "Hidden for user"
        );
      } else {
        alert(data.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message");
    }

    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  // Delete conversation - Updated to handle age-based deletion
  const deleteConversation = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    // Check age for confirmation message
    const now = new Date();
    const ageInHours = 0;
    const confirmMessage =
      "Delete conversation? (System will determine if it's hidden or fully deleted based on age)";

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `/api/conversations?conversationId=${conversationId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (data.success) {
        // Always remove from current user's conversation list
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId)
        );

        // If this was the selected conversation, clear it
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null);
          setMessages([]);
        }

        console.log(
          "✅ Conversation:",
          data.deletedForEveryone ? "Deleted completely" : "Hidden for user"
        );
      } else {
        alert(data.error || "Failed to delete conversation");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      alert("Failed to delete conversation");
    }
  };

  const openDeleteModal = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteModalOpen(true);
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
                <div className="space-y-1 p-2 lg:p-4 min-h-[200px]">
                  <AnimatePresence mode="popLayout">
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
                          exit={{ opacity: 0, x: -100 }}
                          transition={{
                            delay: Math.min(index * 0.05, 0.3),
                            duration: 0.3,
                            ease: "easeOut",
                          }}
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
                  </AnimatePresence>
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
                <div className="bg-white border-b border-slate-100 px-4 lg:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {isMobile && (
                        <button
                          onClick={() => setSelectedConversationId(null)}
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
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {otherParticipant?.name}
                        </h2>
                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                          <span className="capitalize">
                            {otherParticipant?.role}
                          </span>
                          {onlineUsers.includes(otherParticipant?.id || "") && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">Online</span>
                            </>
                          )}
                          {currentTypingUsers.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600">typing...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteConversation(selectedConversationId)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {selectedConversation?.jobContext && (
                    <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg border-l-3 border-blue-500">
                      <p className="text-sm text-blue-700 font-medium">
                        {selectedConversation.jobContext.jobTitle}
                      </p>
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 bg-gradient-to-b from-orange-25 to-white"
                >
                  {messages.map((message) => {
                    const isOwn = message.senderId === session?.user?.id;
                    const isEditing = editingId === message.id;
                    const showActions =
                      isOwn &&
                      (canEditMessage(message) || canDeleteMessage(message));

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1], // Smooth ease-out curve
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.35 },
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

                              {showActions && (
                                <div className="absolute -top-8 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <div className="flex gap-1 bg-white rounded-lg shadow-lg border p-1">
                                    {canEditMessage(message) && (
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
                                    {canDeleteMessage(message) && (
                                      <button
                                        onClick={() =>
                                          openDeleteModal(message.id)
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

      {/* Delete Message Modal */}
      <DeleteMessageModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={(deleteType) => deleteMessage(messageToDelete!, deleteType)}
      />
    </div>
  );
}
