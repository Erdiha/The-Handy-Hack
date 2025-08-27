//api.messages/route
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, conversations, users } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, desc, and, or, isNull, sql } from "drizzle-orm";
import { notifications } from "@/lib/schema";

declare global {
  var io: import("socket.io").Server | undefined;
}

// GET - Fetch messages for a conversation
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
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

    // Verify user is part of this conversation
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
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get all messages for this conversation
    const conversationMessages = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt);

    // Get sender names
    const messagesWithSenders = await Promise.all(
      conversationMessages.map(async (message) => {
        const [sender] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, message.senderId))
          .limit(1);

        return {
          id: message.id.toString(),
          senderId: message.senderId.toString(),
          senderName: message.senderId === userId ? "You" : sender.name,
          content: message.content,
          timestamp: formatMessageTime(message.createdAt),
          isRead: message.isRead,
          canEdit: message.senderId === userId, // User can only edit their own messages
          canDelete: message.senderId === userId, // User can only delete their own messages
        };
      })
    );

    // Mark messages as read for the current user
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, convId),
          eq(
            messages.senderId,
            userId === conversation.participant1
              ? conversation.participant2
              : conversation.participant1
          )
        )
      );

    return NextResponse.json({
      success: true,
      messages: messagesWithSenders,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
});

// POST - Send a new message
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "Conversation ID and content are required" },
        { status: 400 }
      );
    }

    const userId = parseInt(request.user!.id);
    const convId = parseInt(conversationId);

    // Verify user is part of this conversation
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
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: convId,
        senderId: userId,
        content: content.trim(),
      })
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, convId));

    // Create notification for the other participant
    const otherParticipantId =
      conversation.participant1 === userId
        ? conversation.participant2
        : conversation.participant1;

    // Check if notification already exists for this conversation (read or unread)
    console.log("🔍 Looking for existing notification:", {
      userId: otherParticipantId,
      conversationId: convId,
    });

    const [existingNotification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, otherParticipantId),
          eq(notifications.type, "message"),
          eq(notifications.conversationId, convId)
        )
      )
      .limit(1);

    console.log("🔍 Found existing notification:", existingNotification);

    if (existingNotification) {
      // Update existing notification with latest message
      await db
        .update(notifications)
        .set({
          title: `${request.user!.name}`,
          body: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          createdAt: new Date(),
          readAt: null, // Mark as unread again
        })
        .where(eq(notifications.id, existingNotification.id));

      console.log("✅ Updated existing notification:", existingNotification.id);
    } else {
      // Create new notification
      const [newNotification] = await db
        .insert(notifications)
        .values({
          userId: otherParticipantId,
          type: "message",
          title: `${request.user!.name}`,
          body: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          conversationId: convId,
          actionUrl: `/messages?conversationId=${convId}`,
          priority: "normal",
        })
        .returning();

      console.log("✅ Created new notification:", newNotification.id);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id.toString(),
        senderId: userId.toString(),
        senderName: "You",
        content: newMessage.content,
        timestamp: formatMessageTime(newMessage.createdAt),
        isRead: true,
        canEdit: true,
        canDelete: true,
        createdAt: newMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
});
// PATCH - Edit a message
export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    console.log("🔧 PATCH called - checking global.io availability:");
    console.log("🔧 global.io exists:", !!global.io);
    console.log("🔧 global.io type:", typeof global.io);

    if (global.io) {
      console.log("🔧 Socket.io server is available");
    } else {
      console.log(
        "❌ Socket.io server is NOT available - this is the problem!"
      );
    }

    const body = await request.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    const userId = parseInt(request.user!.id);
    const msgId = parseInt(messageId);

    // Verify user owns this message
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, msgId))
      .limit(1);

    if (!message || message.senderId !== userId) {
      return NextResponse.json(
        { error: "Message not found or unauthorized" },
        { status: 404 }
      );
    }
    console.log("🔧 PATCH called - checking global.io availability:");
    console.log("🔧 global.io exists:", !!global.io);
    console.log("🔧 global.io type:", typeof global.io);
    if (global.io) {
      console.log("🔧 Socket.io server is available");
    } else {
      console.log(
        "❌ Socket.io server is NOT available - this is the problem!"
      );
    }

    // Update the message
    const [updatedMessage] = await db
      .update(messages)
      .set({ content: content.trim() })
      .where(eq(messages.id, msgId))
      .returning();

    if (global.io) {
      console.log("📡 Broadcasting message edit via socket");
      console.log("🔧 Edit details:", {
        conversationId: message.conversationId,
        messageId: updatedMessage.id.toString(),
        newContent: updatedMessage.content,
      });

      global.io
        .to(`conversation-${message.conversationId}`)
        .emit("message_edited", {
          messageId: updatedMessage.id.toString(),
          newContent: updatedMessage.content,
          timestamp: formatMessageTime(updatedMessage.createdAt) + " (edited)",
        });

      console.log(
        "✅ Edit broadcast sent to room: conversation-" + message.conversationId
      );
    }

    return NextResponse.json({
      success: true,
      message: {
        id: updatedMessage.id.toString(),
        content: updatedMessage.content,
        timestamp: formatMessageTime(updatedMessage.createdAt) + " (edited)",
      },
    });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
});

// DELETE - Delete/Hide a message
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { deleteType } = body; // 'me' or 'everyone'

    const userId = parseInt(request.user!.id);
    const msgId = parseInt(messageId);

    // Get the message
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, msgId))
      .limit(1);

    if (!message || message.senderId !== userId) {
      return NextResponse.json(
        { error: "Message not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if message is less than 1 hour old for "delete for everyone"
    const messageAge =
      new Date().getTime() - new Date(message.createdAt).getTime();
    const oneHour = 60 * 60 * 1000;
    const canDeleteForEveryone = messageAge <= oneHour;

    if (deleteType === "everyone" && !canDeleteForEveryone) {
      return NextResponse.json(
        { error: "You can only delete for everyone within 1 hour of sending" },
        { status: 400 }
      );
    }

    if (deleteType === "everyone") {
      // Actually delete the message for everyone
      await db.delete(messages).where(eq(messages.id, msgId));
    } else {
      // Hide for current user only
      await db
        .update(messages)
        .set({
          hiddenForUsers: sql`array_append(COALESCE(${messages.hiddenForUsers}, '{}'), ${userId})`,
        })
        .where(eq(messages.id, msgId));
    }

    return NextResponse.json({
      success: true,
      message:
        deleteType === "everyone"
          ? "Message deleted for everyone"
          : "Message deleted for you",
      deleteType,
      messageId: msgId.toString(),
      broadcastDeletion: deleteType === "everyone", // For socket broadcast
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
});

// Helper function to format message time
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
