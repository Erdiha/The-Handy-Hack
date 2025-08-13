"use client";

import { useState,useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Message,JobContext,Conversation } from "@/types/messages";


export default function MessagesPage() {
  const { data: session } = useSession();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [handymanContext, setHandymanContext] = useState<{
    id: string;
    name: string;
    service?: string;
  } | null>(null);

  // ADD THIS - Handle job context from URL
  // Handle both job and handyman context from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Job context
    const jobId = urlParams.get("job");
    const customer = urlParams.get("customer");
    const jobTitle = urlParams.get("title");

    // Handyman context
    const handymanId = urlParams.get("handyman");
    const handymanName = urlParams.get("name");
    const service = urlParams.get("service");

    if (jobId && customer && jobTitle) {
      const context: JobContext = { jobId, customer, jobTitle };
      setJobContext(context);
      setSelectedConversation(`job-${jobId}`);
      setNewMessage(
        `Hi ${customer}! I'm interested in your job: "${jobTitle}". I'd like to discuss the details and provide a quote.`
      );
    } else if (handymanId && handymanName) {
      setHandymanContext({
        id: handymanId,
        name: handymanName,
        service: service || undefined,
      });
      setSelectedConversation(`handyman-${handymanId}`);
      setNewMessage(
        `Hi ${handymanName}! I'd like to discuss a ${
          service || "project"
        } and get a quote.`
      );
    }
  }, []);

  // RENAME your existing conversations array to baseConversations:
  const baseConversations: Conversation[] = [
    {
      id: "1",
      participants: [
        { id: "1", name: "You", role: "customer" },
        { id: "2", name: "Mike Rodriguez", role: "handyman" },
      ],
      lastMessage: {
        id: "1",
        senderId: "2",
        senderName: "Mike Rodriguez",
        content:
          "Hi! I can help with your plumbing issue. When would be a good time to visit?",
        timestamp: "2 minutes ago",
        isRead: false,
      },
      isActive: true,
    },
    {
      id: "2",
      participants: [
        { id: "1", name: "You", role: "customer" },
        { id: "3", name: "Sarah Chen", role: "handyman" },
      ],
      lastMessage: {
        id: "2",
        senderId: "1",
        senderName: "You",
        content: "Thanks for the quote! When can you start the painting job?",
        timestamp: "1 hour ago",
        isRead: true,
      },
      isActive: false,
    },
  ];
  // Mock conversations with dynamic job context - will be real data later
  const conversations: Conversation[] = [
    // Job conversation
    ...(jobContext
      ? [
          {
            id: `job-${jobContext.jobId}`,
            participants: [
              {
                id: "1",
                name: "You",
                role:
                  (session?.user?.role as "customer" | "handyman") ||
                  "customer",
              },
              {
                id: "customer",
                name: jobContext.customer,
                role: "customer" as const,
              },
            ],
            lastMessage: {
              id: "new",
              senderId: "1",
              senderName: "You",
              content: `Interested in: ${jobContext.jobTitle}`,
              timestamp: "now",
              isRead: true,
            },
            isActive: true,
            jobContext: jobContext,
          },
        ]
      : []),

    // Handyman conversation
    ...(handymanContext
      ? [
          {
            id: `handyman-${handymanContext.id}`,
            participants: [
              {
                id: "1",
                name: "You",
                role:
                  (session?.user?.role as "customer" | "handyman") ||
                  "customer",
              },
              {
                id: handymanContext.id,
                name: handymanContext.name,
                role: "handyman" as const,
              },
            ],
            lastMessage: {
              id: "new",
              senderId: "1",
              senderName: "You",
              content: `Contacting about: ${
                handymanContext.service || "services"
              }`,
              timestamp: "now",
              isRead: true,
            },
            isActive: true,
          },
        ]
      : []),

    // Base conversations
    ...baseConversations,
  ];

  // Mock messages for selected conversation
  const messages: Message[] = selectedConversation
    ? [
        {
          id: "1",
          senderId: "1",
          senderName: "You",
          content:
            "Hi Mike! I have a leaky faucet in my kitchen that needs fixing. Are you available this week?",
          timestamp: "10:30 AM",
          isRead: true,
        },
        {
          id: "2",
          senderId: "2",
          senderName: "Mike Rodriguez",
          content:
            "Hi! I can definitely help with that. I have availability tomorrow afternoon or Thursday morning. The repair usually takes 1-2 hours.",
          timestamp: "10:45 AM",
          isRead: true,
        },
        {
          id: "3",
          senderId: "2",
          senderName: "Mike Rodriguez",
          content:
            "My rate for plumbing repairs is $75/hour. Would you like me to come take a look?",
          timestamp: "10:46 AM",
          isRead: false,
        },
      ]
    : [];

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    // Here we'll add real message sending logic later
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const otherParticipant = selectedConversation
    ? conversations
        .find((c) => c.id === selectedConversation)
        ?.participants.find((p) => p.id !== "1")
    : null;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div className="lg:col-span-4 bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-orange-100">
                Stay connected with your neighborhood pros
              </p>
            </div>

            {/* Conversation List */}
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
                      (p) => p.id !== "1"
                    );
                    return (
                      <motion.div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                          selectedConversation === conversation.id
                            ? "bg-orange-100 border-orange-300 border-2"
                            : "hover:bg-slate-50 border-2 border-transparent"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold">
                              {otherPerson?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-slate-800 truncate">
                                {otherPerson?.name}
                              </h3>
                              <span className="text-xs text-slate-500">
                                {conversation.lastMessage.timestamp}
                              </span>
                            </div>

                            <p className="text-sm text-slate-600 truncate">
                              {conversation.lastMessage.content}
                            </p>

                            {!conversation.lastMessage.isRead && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                {/* REPLACE the chat header with this: */}
                <div className="border-b border-slate-200 p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold">
                        {otherParticipant?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-800">
                        {otherParticipant?.name}
                      </h2>
                      <p className="text-slate-500 capitalize">
                        {otherParticipant?.role}
                      </p>

                      {/* ADD THIS - Job context display */}
                      {jobContext && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm">
                            <span className="font-semibold text-blue-800">
                              💼 Job:
                            </span>
                            <span className="text-blue-700 ml-1">
                              {jobContext.jobTitle}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === "1";
                    return (
                      <motion.div
                        key={message.id}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            isOwn
                              ? "bg-orange-500 text-white"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-2 ${
                              isOwn ? "text-orange-100" : "text-slate-500"
                            }`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="border-t border-slate-200 p-6">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 px-6 py-3 rounded-xl"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* No Conversation Selected */
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
