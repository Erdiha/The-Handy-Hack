import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, conversations, users } from '@/lib/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/security';
import { eq, desc, and, or } from 'drizzle-orm';

// GET - Fetch messages for a conversation
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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
        { error: 'Conversation not found' },
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
          senderName: message.senderId === userId ? 'You' : sender.name,
          content: message.content,
          timestamp: formatMessageTime(message.createdAt),
          isRead: message.isRead,
          canEdit: message.senderId === userId, // User can only edit their own messages
          canDelete: message.senderId === userId // User can only delete their own messages
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
          eq(messages.senderId, userId === conversation.participant1 ? conversation.participant2 : conversation.participant1)
        )
      );

    return NextResponse.json({
      success: true,
      messages: messagesWithSenders
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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
        { error: 'Conversation ID and content are required' },
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
        { error: 'Conversation not found' },
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

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id.toString(),
        senderId: userId.toString(),
        senderName: 'You',
        content: newMessage.content,
        timestamp: formatMessageTime(newMessage.createdAt),
        isRead: true,
        canEdit: true,
        canDelete: true
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
});

// PATCH - Edit a message
export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { messageId, content } = body;
    
    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'Message ID and content are required' },
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
        { error: 'Message not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the message
    const [updatedMessage] = await db
      .update(messages)
      .set({ content: content.trim() })
      .where(eq(messages.id, msgId))
      .returning();

    return NextResponse.json({
      success: true,
      message: {
        id: updatedMessage.id.toString(),
        content: updatedMessage.content,
        timestamp: formatMessageTime(updatedMessage.createdAt) + ' (edited)'
      }
    });

  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
});

// DELETE - Delete a message
export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
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
        { error: 'Message not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the message
    await db.delete(messages).where(eq(messages.id, msgId));

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
});

// Helper function to format message time
function formatMessageTime(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (messageDate.getTime() === today.getTime()) {
    return timeStr; // "2:30 PM"
  } else {
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      return `Yesterday ${timeStr}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}