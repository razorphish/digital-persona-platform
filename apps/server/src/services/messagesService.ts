import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, count, sql, gte, or } from "drizzle-orm";
import {
  userDmMessages,
  userDmThreads,
  users,
  personas,
} from "@digital-persona/database/schema";

export interface MessageItem {
  id: string;
  from: string;
  preview: string;
  time: string;
  threadId?: string;
  senderId?: string;
  isRead?: boolean;
}

export interface MessageThread {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: string[];
}

export class MessagesService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  /**
   * Get user's messages with pagination
   */
  async getUserMessages(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MessageItem[]> {
    try {
      // Get messages from threads where user is a participant
      const messages = await this.db
        .select({
          message: userDmMessages,
          sender: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
          thread: {
            id: userDmThreads.id,
            userAId: userDmThreads.userAId,
            userBId: userDmThreads.userBId,
          },
        })
        .from(userDmMessages)
        .leftJoin(users, eq(userDmMessages.senderId, users.id))
        .leftJoin(userDmThreads, eq(userDmMessages.threadId, userDmThreads.id))
        .where(
          // Get messages from threads where user is a participant (either userA or userB)
          or(
            eq(userDmThreads.userAId, userId),
            eq(userDmThreads.userBId, userId)
          )
        )
        .orderBy(desc(userDmMessages.createdAt))
        .limit(limit)
        .offset(offset);

      return messages.map((m) => ({
        id: m.message.id,
        from: m.sender?.name || "Unknown User",
        preview:
          m.message.content.length > 50
            ? m.message.content.substring(0, 50) + "..."
            : m.message.content,
        time: this.formatTimeAgo(m.message.createdAt),
        threadId: m.thread?.id,
        senderId: m.message.senderId,
        isRead: m.message.isRead ?? undefined,
      }));
    } catch (error) {
      console.error("Error getting user messages:", error);
      return [];
    }
  }

  /**
   * Format timestamp to "time ago" format
   */
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  }
}
