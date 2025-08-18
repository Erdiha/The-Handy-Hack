// app/api/messages/poll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { messages, conversations, users } from "@/lib/schema";
import { eq, and, or, gt, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const afterMessageId = searchParams.get("after");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
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

    // Build query for new messages
    let query = db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(desc(messages.createdAt))
      .limit(10);

    // If afterMessageId is provided, only get messages after that ID
    if (afterMessageId) {
      const afterId = parseInt(afterMessageId);
      if (!isNaN(afterId)) {
        query = db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            content: messages.content,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(
            and(eq(messages.conversationId, convId), gt(messages.id, afterId))
          )
          .orderBy(messages.createdAt)
          .limit(5);
      }
    }

    const newMessages = await query;

    // Get sender names
    const messagesWithSenders = await Promise.all(
      newMessages.map(async (message) => {
        const [sender] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, message.senderId))
          .limit(1);

        return {
          id: message.id.toString(),
          conversationId: convId.toString(),
          senderId: message.senderId.toString(),
          senderName:
            message.senderId === userId ? "You" : sender?.name || "Unknown",
          content: message.content,
          timestamp: formatMessageTime(message.createdAt),
          isRead: message.isRead,
          canEdit: message.senderId === userId,
          canDelete: message.senderId === userId,
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: messagesWithSenders,
    });
  } catch (error) {
    console.error("Error polling messages:", error);
    return NextResponse.json(
      { error: "Failed to poll messages" },
      { status: 500 }
    );
  }
}

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
    return timeStr;
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
