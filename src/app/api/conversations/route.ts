import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, messages, users, jobs } from "@/lib/schema";
import { withAuth, AuthenticatedRequest } from "@/lib/security";
import { eq, or, and, desc, sql } from "drizzle-orm";

// GET - Fetch user's conversations
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const userId = parseInt(request.user!.id);

    const userConversations = await db
      .select({
        id: conversations.id,
        jobId: conversations.jobId,
        participant1: conversations.participant1,
        participant2: conversations.participant2,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1, userId),
          eq(conversations.participant2, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

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

// POST - Create conversation (NO TRANSACTIONS - Neon compatible)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  // Move userId outside try block to fix scope issue
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
    console.log("🔍 Checking if target user exists...");
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

    // Check for existing conversation with proper ordering (NO TRANSACTION)
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
      console.log("💬 Checking for general conversation");
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

    if (existingConversation.length > 0) {
      console.log(
        "✅ Found existing conversation:",
        existingConversation[0].id
      );
      return NextResponse.json({
        success: true,
        conversationId: existingConversation[0].id.toString(),
        message: "Using existing conversation",
      });
    }

    // Create new conversation (NO TRANSACTION)
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

    // Send initial message if provided (SEPARATE OPERATION)
    if (initialMessage) {
      console.log("📝 Adding initial message...");

      try {
        await db.insert(messages).values({
          conversationId: newConversation.id,
          senderId: userId,
          content: initialMessage,
        });

        await db
          .update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, newConversation.id));

        console.log("✅ Initial message added");
      } catch (messageError) {
        console.error(
          "⚠️ Failed to add initial message, but conversation created:",
          messageError
        );
        // Continue anyway - conversation is created
      }
    }

    console.log("✅ CONVERSATION CREATED SUCCESSFULLY");
    console.log("===============================");

    return NextResponse.json({
      success: true,
      conversationId: newConversation.id.toString(),
      message: "Conversation created",
    });
  } catch (error) {
    console.error("💥 DETAILED ERROR in conversation creation:");
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    console.error("===============================");

    // Handle unique constraint violations (conversation already exists)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      console.log(
        "🔄 Unique constraint violation, fetching existing conversation..."
      );

      try {
        const { otherUserId, jobId } = await request.json();
        const otherUserIdInt = parseInt(otherUserId);

        const [participant1, participant2] =
          userId < otherUserIdInt
            ? [userId, otherUserIdInt]
            : [otherUserIdInt, userId];

        const [existing] = await db
          .select()
          .from(conversations)
          .where(
            and(
              jobId
                ? eq(conversations.jobId, parseInt(jobId))
                : sql`${conversations.jobId} IS NULL`,
              eq(conversations.participant1, participant1),
              eq(conversations.participant2, participant2)
            )
          )
          .limit(1);

        if (existing) {
          console.log(
            "✅ Found existing conversation after constraint violation:",
            existing.id
          );
          return NextResponse.json({
            success: true,
            conversationId: existing.id.toString(),
            message: "Using existing conversation",
          });
        }
      } catch (fetchError) {
        console.error("❌ Error fetching existing conversation:", fetchError);
      }
    }

    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
});

// DELETE - Delete conversation
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
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

    // Get conversation with creation date
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

    // Check conversation age
    const conversationAge =
      new Date().getTime() - new Date(conversation.createdAt).getTime();
    const oneHour = 60 * 60 * 1000;
    const canDeleteForEveryone = conversationAge <= oneHour;

    if (canDeleteForEveryone) {
      // Delete entire conversation and all messages for everyone
      console.log("🗑️ Deleting conversation completely (under 1 hour old)");
      await db.delete(messages).where(eq(messages.conversationId, convId));
      await db.delete(conversations).where(eq(conversations.id, convId));

      return NextResponse.json({
        success: true,
        message: canDeleteForEveryone
          ? "Conversation deleted completely"
          : "Conversation hidden for you",
        deletedForEveryone: canDeleteForEveryone,
        conversationAge: conversationAge, // Add this for debugging
      });
    } else {
      // Hide conversation for current user only
      console.log("🙈 Hiding conversation for user (over 1 hour old)");
      await db
        .update(conversations)
        .set({
          hiddenForUsers: sql`array_append(COALESCE(${conversations.hiddenForUsers}, '{}'), ${userId})`,
        })
        .where(eq(conversations.id, convId));

      return NextResponse.json({
        success: true,
        message: "Conversation hidden for you",
        deletedForEveryone: false,
      });
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
});
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
