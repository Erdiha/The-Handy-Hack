// /api/conversations/route.ts - COMPLETE FIXED VERSION
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  users,
  jobs,
  notifications,
} from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, or, and, desc, sql } from "drizzle-orm";

declare global {
  var io: import("socket.io").Server | undefined;
}

// GET - Fetch user's conversations
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    console.log("🔍 GET conversations for user:", userId);

    const userConversations = await db
      .select({
        id: conversations.id,
        jobId: conversations.jobId,
        participant1: conversations.participant1,
        participant2: conversations.participant2,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        hiddenForUsers: conversations.hiddenForUsers,
      })
      .from(conversations)
      .where(
        and(
          // User is participant
          or(
            eq(conversations.participant1, userId),
            eq(conversations.participant2, userId)
          ),
          // Conversation is NOT hidden for this user
          sql`NOT (${userId} = ANY(COALESCE(${conversations.hiddenForUsers}, ARRAY[]::integer[])))`
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    console.log("🔍 Found conversations:", userConversations.length);

    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        const otherParticipantId =
          conv.participant1 === userId ? conv.participant2 : conv.participant1;

        const [otherUser] = await db
          .select({
            id: users.id,
            name: users.name,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, otherParticipantId))
          .limit(1);

        const [lastMessage] = await db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            content: messages.content,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        let jobContext = null;
        if (conv.jobId) {
          const [job] = await db
            .select({
              id: jobs.id,
              title: jobs.title,
              category: jobs.category,
            })
            .from(jobs)
            .where(eq(jobs.id, conv.jobId))
            .limit(1);

          if (job) {
            jobContext = {
              jobId: job.id.toString(),
              jobTitle: job.title,
              category: job.category,
            };
          }
        }

        return {
          id: conv.id.toString(),
          participants: [
            { id: userId.toString(), name: "You", role: request.user!.role },
            {
              id: otherUser.id.toString(),
              name: otherUser.name,
              role: otherUser.role,
            },
          ],
          lastMessage: lastMessage
            ? {
                id: lastMessage.id.toString(),
                senderId: lastMessage.senderId.toString(),
                senderName:
                  lastMessage.senderId === userId ? "You" : otherUser.name,
                content: lastMessage.content,
                timestamp: getRelativeTime(lastMessage.createdAt),
                isRead: lastMessage.isRead,
              }
            : null,
          isActive: true,
          jobContext,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
});

// POST - Create conversation
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const userId = parseInt(request.user!.id);

  try {
    const body = await request.json();
    const { otherUserId, jobId, initialMessage } = body;

    console.log("=== CONVERSATION CREATE REQUEST ===");
    console.log("Current user ID:", userId);
    console.log("Target user ID:", otherUserId);
    console.log("Job ID:", jobId);
    console.log("Has initial message:", !!initialMessage);

    const otherUserIdInt = parseInt(otherUserId);

    // Validate inputs
    if (isNaN(otherUserIdInt) || otherUserIdInt <= 0) {
      console.error("❌ Invalid user ID:", otherUserId);
      return NextResponse.json(
        { error: "Invalid user ID provided" },
        { status: 400 }
      );
    }

    if (userId === otherUserIdInt) {
      console.error("❌ User trying to message themselves:", userId);
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const [targetUser] = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, otherUserIdInt))
      .limit(1);

    if (!targetUser) {
      console.error("❌ Target user not found in database:", otherUserIdInt);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ Target user found:", targetUser.name, targetUser.role);

    // Check for existing conversation
    const [participant1, participant2] =
      userId < otherUserIdInt
        ? [userId, otherUserIdInt]
        : [otherUserIdInt, userId];

    console.log(
      "🔍 Looking for existing conversation between:",
      participant1,
      participant2
    );

    let existingConversation;

    if (jobId) {
      // Job-specific conversation
      console.log("📋 Checking for job-specific conversation, jobId:", jobId);
      existingConversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.jobId, parseInt(jobId)),
            eq(conversations.participant1, participant1),
            eq(conversations.participant2, participant2)
          )
        )
        .limit(1);
    } else {
      // General conversation
      console.log("💬 Checking for general conversation (including hidden)");
      existingConversation = await db
        .select()
        .from(conversations)
        .where(
          and(
            sql`${conversations.jobId} IS NULL`,
            eq(conversations.participant1, participant1),
            eq(conversations.participant2, participant2)
          )
        )
        .limit(1);
    }

    // Handle existing conversation
    if (existingConversation.length > 0) {
      const conversation = existingConversation[0];
      console.log("✅ Found existing conversation:", conversation.id);

      const hiddenUsers = conversation.hiddenForUsers || [];
      const isHiddenForUser = hiddenUsers.includes(userId);

      console.log("🔍 Conversation hidden status:", {
        conversationId: conversation.id,
        hiddenUsers,
        userId,
        isHiddenForUser,
      });

      if (isHiddenForUser) {
        console.log("🔄 UNHIDING conversation for user:", userId);
        await db
          .update(conversations)
          .set({
            hiddenForUsers: sql`array_remove(${conversations.hiddenForUsers}, ${userId})`,
          })
          .where(eq(conversations.id, conversation.id));
        console.log("✅ Conversation unhidden");
      }

      // Send initial message to existing conversation
      if (initialMessage) {
        console.log("📝 Adding initial message to existing conversation...");

        try {
          const [newMessage] = await db
            .insert(messages)
            .values({
              conversationId: conversation.id,
              senderId: userId,
              content: initialMessage,
            })
            .returning();

          // Update conversation timestamp
          await db
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, conversation.id));

          // Create notification
          await createNotification(
            otherUserIdInt,
            conversation.id,
            initialMessage,
            request.user!.name
          );

          // Emit socket events
          emitSocketEvents(
            otherUserIdInt,
            conversation.id,
            newMessage,
            userId,
            request.user!.name,
            initialMessage
          );

          console.log("✅ Message, notification, and socket events completed");
        } catch (messageError) {
          console.error("⚠️ Failed to add initial message:", messageError);
        }
      }

      return NextResponse.json({
        success: true,
        conversationId: conversation.id.toString(),
        message: isHiddenForUser
          ? "Conversation restored"
          : "Using existing conversation",
      });
    }

    // Create new conversation
    console.log("🆕 Creating new conversation...");
    const [newConversation] = await db
      .insert(conversations)
      .values({
        participant1,
        participant2,
        jobId: jobId ? parseInt(jobId) : null,
      })
      .returning();

    console.log("✅ New conversation created with ID:", newConversation.id);

    // Send initial message to new conversation
    if (initialMessage) {
      console.log("📝 Adding initial message to new conversation...");

      try {
        const [newMessage] = await db
          .insert(messages)
          .values({
            conversationId: newConversation.id,
            senderId: userId,
            content: initialMessage,
          })
          .returning();

        await db
          .update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, newConversation.id));

        // Create notification
        await createNotification(
          otherUserIdInt,
          newConversation.id,
          initialMessage,
          request.user!.name
        );

        // Emit socket events
        emitSocketEvents(
          otherUserIdInt,
          newConversation.id,
          newMessage,
          userId,
          request.user!.name,
          initialMessage
        );

        console.log("✅ Message, notification, and socket events completed");
      } catch (messageError) {
        console.error("⚠️ Failed to add initial message:", messageError);
      }
    }

    console.log("✅ CONVERSATION CREATED SUCCESSFULLY");

    return NextResponse.json({
      success: true,
      conversationId: newConversation.id.toString(),
      message: "Conversation created",
    });
  } catch (error) {
    console.error("💥 Error in conversation creation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
});

// DELETE - Delete conversation
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    console.log("🔧 === DELETE CONVERSATION STARTED ===");

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const userId = parseInt(request.user!.id);
    const convId = parseInt(conversationId);

    // Get conversation details
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, convId),
          or(
            eq(conversations.participant1, userId),
            eq(conversations.participant2, userId)
          )
        )
      )
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if user is already hidden
    const currentHiddenUsers = conversation.hiddenForUsers || [];
    const isAlreadyHidden = currentHiddenUsers.includes(userId);

    if (isAlreadyHidden) {
      return NextResponse.json({
        success: true,
        message: "Conversation already hidden for you",
        deletedForEveryone: false,
      });
    }

    // Add user to hidden array
    const updateResult = await db
      .update(conversations)
      .set({
        hiddenForUsers: sql`array_append(COALESCE(${conversations.hiddenForUsers}, '{}'), ${userId})`,
      })
      .where(eq(conversations.id, convId))
      .returning();

    const updatedConversation = updateResult[0];
    if (!updatedConversation) {
      return NextResponse.json(
        { error: "Failed to update conversation" },
        { status: 500 }
      );
    }

    const newHiddenUsers = updatedConversation.hiddenForUsers || [];
    const participant1 = updatedConversation.participant1;
    const participant2 = updatedConversation.participant2;

    // Check if both users have hidden the conversation
    const bothUsersHidden =
      newHiddenUsers.includes(participant1) &&
      newHiddenUsers.includes(participant2);

    if (bothUsersHidden) {
      console.log("🗑️ Both users deleted conversation - deleting completely");

      // Delete all messages in this conversation
      await db.delete(messages).where(eq(messages.conversationId, convId));

      // Delete the conversation itself
      await db.delete(conversations).where(eq(conversations.id, convId));

      return NextResponse.json({
        success: true,
        message: "Conversation deleted completely (both users deleted)",
        deletedForEveryone: true,
        archivedCompletely: true,
      });
    } else {
      console.log("🙈 Hidden conversation for current user only");

      return NextResponse.json({
        success: true,
        message: "Conversation hidden for you",
        deletedForEveryone: false,
        archivedCompletely: false,
      });
    }
  } catch (error) {
    console.error("💥 Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
});

// Helper function - Create notification
async function createNotification(
  otherUserId: number,
  conversationId: number,
  messageContent: string,
  senderName: string
) {
  try {
    console.log("🔔 Creating notification for user:", otherUserId);

    // Check for existing notification
    const [existingNotification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, otherUserId),
          eq(notifications.type, "message"),
          eq(notifications.conversationId, conversationId)
        )
      )
      .limit(1);

    if (existingNotification) {
      // Update existing notification
      await db
        .update(notifications)
        .set({
          title: senderName,
          body:
            messageContent.substring(0, 100) +
            (messageContent.length > 100 ? "..." : ""),
          createdAt: new Date(),
          readAt: null,
        })
        .where(eq(notifications.id, existingNotification.id));

      console.log("✅ Updated existing notification");
    } else {
      // Create new notification
      await db.insert(notifications).values({
        userId: otherUserId,
        type: "message",
        title: senderName,
        body:
          messageContent.substring(0, 100) +
          (messageContent.length > 100 ? "..." : ""),
        conversationId: conversationId,
        actionUrl: `/messages?conversationId=${conversationId}`,
        priority: "normal",
      });

      console.log("✅ Created new notification");
    }
  } catch (error) {
    console.error("❌ Failed to create notification:", error);
  }
}

// Properly typed message interface
interface DatabaseMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean | null;
  createdAt: Date;
  hiddenForUsers: number[] | null;
}

// Helper function - Emit socket events (PROPERLY TYPED)
function emitSocketEvents(
  otherUserId: number,
  conversationId: number,
  message: DatabaseMessage,
  senderId: number,
  senderName: string,
  content: string
): void {
  if (global.io) {
    console.log("📡 Emitting socket events for real-time updates");

    // 1. Notification update for bell icon
    global.io.to(`user-${otherUserId}`).emit("notification_update", {
      userId: otherUserId,
      conversationId: conversationId,
      type: "message",
    });

    // 2. New message event for real-time chat
    global.io.to(`conversation-${conversationId}`).emit("new_message", {
      id: message.id.toString(),
      conversationId: conversationId.toString(),
      senderId: senderId.toString(),
      senderName: senderName,
      content: content,
      timestamp: formatMessageTime(message.createdAt),
      isRead: false,
      createdAt: message.createdAt.toISOString(),
    });

    console.log("✅ Socket events emitted successfully");
  } else {
    console.log("⚠️ Socket.io not available for real-time updates");
  }
}

// Helper function - Format message time
function formatMessageTime(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (messageDate.getTime() === today.getTime()) {
    return timeStr; // "2:30 PM"
  } else {
    const diffDays = Math.floor(
      (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      return `Yesterday ${timeStr}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString("en-US", {
        weekday: "short",
      })} ${timeStr}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }
}

// Helper function - Get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return minutes <= 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
}
