"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRealTimeMessages } from "@/hooks/useRealTimeMessages";
import { useNotifications } from "@/contexts/NotificationContext";

// ✅ PROPER TYPESCRIPT INTERFACES
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

  // ✅ CLEAN STATE MANAGEMENT
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

  // Refs for cleanup
  const initializedRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Real-time messaging
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

        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === newMsg.id);
          if (exists) return prev;
          return [...prev, newMsg];
        });

        // Update conversation list
        loadConversations();
      },
      [selectedConversationId, session?.user?.id]
    ),
  });

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ✅ SIMPLE CONVERSATION LOADING
  const loadConversations = async () => {
    console.log("📋 Loading conversations...");

    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();

      console.log("📋 Conversations API Response:", data);

      if (data.success) {
        setConversations(data.conversations);
        console.log("✅ Loaded conversations:", data.conversations.length);
      } else {
        console.error("❌ Conversations API Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Network Error loading conversations:", error);
    }
  };

  // ✅ SIMPLE MESSAGE LOADING
  const loadMessages = async (conversationId: string) => {
    console.log("💬 Loading messages for conversation:", conversationId);
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

      console.log("💬 Messages API Response:", data);

      if (data.success) {
        setMessages(data.messages);
        setSelectedConversationId(conversationId);

        // Join conversation for real-time updates
        joinConversation(conversationId);
        setActiveConversation(conversationId);

        console.log("✅ Loaded messages:", data.messages.length);

        // Mark conversation as read
        await fetch("/api/notifications/mark-conversation-read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });

        refreshNotifications();
      } else {
        console.error("❌ Messages API Error:", data.error);
      }
    } catch (error) {
      console.error("❌ Network Error loading messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ✅ SIMPLE URL PARAMETER HANDLING
  const handleContactNowFlow = async () => {
    console.log("🔗 === CONTACT NOW FLOW STARTED ===");

    const params = new URLSearchParams(window.location.search);
    const handymanId = params.get("handyman");
    const handymanName = params.get("name");
    const service = params.get("service");

    console.log("🔗 URL Parameters:", { handymanId, handymanName, service });

    // Only process if we have handyman parameters
    if (!handymanId || !handymanName) {
      console.log("⚠️ No handyman parameters found - normal page load");
      return false;
    }

    console.log("💬 Contact Now flow detected");

    try {
      // Create initial message
      const initialMessage = `Hi ${handymanName}! I'd like to discuss a ${
        service || "project"
      } and get a quote.`;
      console.log("📝 Initial message:", initialMessage);

      // Step 1: Create/find conversation
      console.log("📞 Step 1: Creating conversation...");
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
      console.log("📞 Conversation API response:", data);

      if (!data.success) {
        console.error("❌ Failed to create conversation:", data.error);
        return false;
      }

      const conversationId = data.conversationId;
      console.log("✅ Got conversation ID:", conversationId);

      // Step 2: Load conversations (this will include the new/updated one)
      console.log("📋 Step 2: Loading conversations...");
      await loadConversations();
      console.log("✅ Conversations loaded");

      // Step 3: Open the specific conversation
      console.log("💬 Step 3: Opening conversation...");
      await loadMessages(conversationId);
      console.log("✅ Messages loaded");

      // Step 4: Clean up URL (remove parameters)
      console.log("🧹 Step 4: Cleaning URL...");
      window.history.replaceState({}, "", "/messages");
      console.log("✅ URL cleaned");

      console.log("🎉 === CONTACT NOW FLOW COMPLETED ===");
      return true;
    } catch (error) {
      console.error("💥 Error in Contact Now flow:", error);
      return false;
    }
  };
  // ✅ SIMPLE URL PARAMETER HANDLING
  const handleURLParameters = async () => {
    const params = new URLSearchParams(window.location.search);
    const handymanId = params.get("handyman");
    const handymanName = params.get("name");
    const service = params.get("service");

    console.log("🔗 URL Parameters:", { handymanId, handymanName, service });

    if (handymanId && handymanName) {
      console.log("💬 Contact Now flow detected");

      const initialMessage = `Hi ${handymanName}! I'd like to discuss a ${
        service || "project"
      } and get a quote.`;

      try {
        console.log("📞 Creating conversation...");
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
        console.log("📞 Conversation creation response:", data);

        if (data.success) {
          console.log("✅ Conversation created/found:", data.conversationId);

          // Load conversations first
          await loadConversations();

          // Then open the specific conversation
          await loadMessages(data.conversationId);

          console.log("✅ Contact Now flow completed");

          // Clean URL
          window.history.replaceState({}, "", "/messages");
        } else {
          console.error("❌ Failed to create conversation:", data);
        }
      } catch (error) {
        console.error("❌ Error in Contact Now flow:", error);
      }
    }
  };

  // ✅ UPDATED INITIALIZATION - Replace your existing useEffect
  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current || !session?.user?.id) return;
      initializedRef.current = true;

      console.log("🚀 Initializing Messages Page...");

      // Check if coming from "Contact Now" URL
      const hasHandymanParams = window.location.search.includes("handyman");

      if (hasHandymanParams) {
        console.log("🔗 Contact Now flow detected");
        const success = await handleContactNowFlow();
        if (!success) {
          // Fallback to normal loading if Contact Now fails
          console.log("⚠️ Contact Now failed, loading conversations normally");
          await loadConversations();
        }
      } else {
        console.log("📋 Normal page load");
        await loadConversations();
      }

      setLoading(false);
      console.log("✅ Messages Page initialized");
    };

    initialize();
  }, [session?.user?.id]);

  // ✅ SIMPLE MESSAGE SENDING
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      // Stop typing indicator
      stopTyping(selectedConversationId);

      // Create optimistic message
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
        // Replace optimistic message with real one
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

        // Send via socket for real-time
        socketSendMessage(selectedConversationId, messageContent);

        // Refresh conversation list
        loadConversations();

        console.log("✅ Message sent successfully");
      } else {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
        setNewMessage(messageContent);
        console.error("❌ Failed to send message:", data.error);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setNewMessage(messageContent);
    }

    setSending(false);
  };

  // ✅ SIMPLE DELETE CONVERSATION
  const deleteConversation = async (conversationId: string) => {
    const confirmMessage =
      "Delete this conversation? This action cannot be undone.";

    if (!confirm(confirmMessage)) return;

    try {
      console.log("🗑️ Deleting conversation:", conversationId);

      const response = await fetch(
        `/api/conversations?conversationId=${conversationId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Conversation deleted:", data.message);

        // Remove from conversations list
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId)
        );

        // If this was selected conversation, clear it
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null);
          setMessages([]);
        }
      } else {
        console.error("❌ Delete failed:", data.error);
        alert("Failed to delete conversation: " + data.error);
      }
    } catch (error) {
      console.error("❌ Delete error:", error);
      alert("Failed to delete conversation");
    }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get current typing users
  const currentTypingUsers = typingUsers.filter(
    (user) =>
      user.conversationId === selectedConversationId &&
      user.userId !== session?.user?.id
  );

  // Get selected conversation and other participant
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
          {/* LEFT: Conversations List */}
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
                    const isSelected =
                      selectedConversationId === conversation.id;
                    const isJobConversation = !!conversation.jobContext;

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
                        {/* Main Content */}
                        <div className="flex space-x-3">
                          {/* Avatar */}
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

                            {/* Online Indicator */}
                            {isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-sm truncate text-slate-800">
                                {otherPerson?.name}
                                <span className="text-xs text-slate-400 capitalize italic font-normal ml-1">
                                  - {otherPerson?.role}
                                </span>
                              </h3>
                            </div>

                            {/* Conversation Type Label */}
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

                            {/* Last Message */}
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
                            e.stopPropagation(); // Prevent opening conversation
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

                  {/* Job Context */}
                  {selectedConversation?.jobContext && (
                    <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg border-l-3 border-blue-500">
                      <p className="text-sm text-blue-700 font-medium">
                        🔧 {selectedConversation.jobContext.jobTitle}
                      </p>
                    </div>
                  )}
                </div>

                {/* Messages Area */}
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
                    messages.map((message) => {
                      const isOwn = message.senderId === session?.user?.id;

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
                            className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 lg:px-4 py-2 lg:py-3 rounded-2xl transition-all duration-200 ${
                              isOwn
                                ? `bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg ${
                                    message.isOptimistic ? "opacity-70" : ""
                                  }`
                                : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-800 shadow-md"
                            }`}
                          >
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
