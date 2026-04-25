import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../common/request-with-user";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomMessages(user: AuthenticatedUser, roomId: string) {
    await this.assertRoomAccess(user, roomId);

    const items = await this.prisma.roomMessage.findMany({
      where: { roomId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        replyToMessage: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reactions: true,
      },
      orderBy: { createdAt: "asc" },
    } as any);

    return {
      items: (items as any[]).map((item) => this.serializeRoomMessage(item, user.id)),
    };
  }

  async createRoomMessage(
    user: AuthenticatedUser,
    roomId: string,
    body: string,
    replyToMessageId?: string,
  ) {
    await this.assertRoomAccess(user, roomId);

    if (replyToMessageId) {
      const replyTarget = await this.prisma.roomMessage.findUnique({
        where: { id: replyToMessageId },
        select: { id: true, roomId: true },
      });

      if (!replyTarget || replyTarget.roomId !== roomId) {
        throw new NotFoundException("Reply target was not found in this room.");
      }
    }

    const item = await this.prisma.roomMessage.create({
      data: {
        roomId,
        authorId: user.id,
        body,
        replyToMessageId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        replyToMessage: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        reactions: true,
      },
    } as any);

    return { item: this.serializeRoomMessage(item as any, user.id) };
  }

  async toggleRoomMessageReaction(
    user: AuthenticatedUser,
    roomId: string,
    messageId: string,
    emoji: string,
  ) {
    const normalizedEmoji = emoji.trim();
    if (!normalizedEmoji) {
      throw new NotFoundException("Choose an emoji reaction.");
    }

    await this.assertRoomAccess(user, roomId);

    const message = await this.prisma.roomMessage.findUnique({
      where: { id: messageId },
      select: { id: true, roomId: true },
    });

    if (!message || message.roomId !== roomId) {
      throw new NotFoundException("Message not found.");
    }

    const existingReaction = await (this.prisma as any).roomMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji: normalizedEmoji,
        },
      },
    });

    if (existingReaction) {
      await (this.prisma as any).roomMessageReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      await (this.prisma as any).roomMessageReaction.create({
        data: {
          messageId,
          userId: user.id,
          emoji: normalizedEmoji,
        },
      });
    }

    const reactions = await (this.prisma as any).roomMessageReaction.findMany({
      where: { messageId },
      orderBy: [{ emoji: "asc" }, { createdAt: "asc" }],
    });

    return {
      item: this.serializeReactionSummary(reactions, user.id),
    };
  }

  async getDirectMessages(user: AuthenticatedUser, conversationId: string) {
    await this.assertConversationAccess(user.id, conversationId);

    const items = await this.prisma.directMessage.findMany({
      where: { conversationId },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { items };
  }

  async createDirectMessage(
    user: AuthenticatedUser,
    conversationId: string,
    body: string,
  ) {
    await this.assertConversationAccess(user.id, conversationId);

    const item = await this.prisma.directMessage.create({
      data: {
        conversationId,
        authorId: user.id,
        body,
      },
    });

    return { item };
  }

  private async assertRoomAccess(user: AuthenticatedUser, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException("Room not found.");
    }

    if (room.organization.universityId !== user.universityId) {
      throw new ForbiddenException("This room belongs to a different university.");
    }

    if (!room.organization.memberships.length) {
      throw new ForbiddenException("Join the organization to access its rooms.");
    }

    const membership = room.organization.memberships[0];
    if (membership?.role === "VIEWER" && room.isPrivate) {
      throw new ForbiddenException(
        "Viewer access is limited to open rooms for this organization.",
      );
    }
  }

  private async assertConversationAccess(userId: string, conversationId: string) {
    const participant = await this.prisma.directConversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException("You do not have access to this conversation.");
    }
  }

  private serializeRoomMessage(
    message: {
      id: string;
      body: string;
      createdAt: Date;
      author: { id: string; firstName: string; lastName: string };
      replyToMessage?: {
        id: string;
        body: string;
        author: { id: string; firstName: string; lastName: string };
      } | null;
      reactions: Array<{ emoji: string; userId: string }>;
    },
    currentUserId: string,
  ) {
    return {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      authorId: message.author.id,
      authorName: `${message.author.firstName} ${message.author.lastName}`,
      replyToMessage: message.replyToMessage
        ? {
            id: message.replyToMessage.id,
            body: message.replyToMessage.body,
            authorId: message.replyToMessage.author.id,
            authorName: `${message.replyToMessage.author.firstName} ${message.replyToMessage.author.lastName}`,
          }
        : null,
      reactions: this.serializeReactionSummary(message.reactions, currentUserId),
    };
  }

  private serializeReactionSummary(
    reactions: Array<{ emoji: string; userId: string }>,
    currentUserId: string,
  ) {
    const groupedReactions = new Map<
      string,
      { emoji: string; count: number; reactedByCurrentUser: boolean }
    >();

    reactions.forEach((reaction) => {
      const existing = groupedReactions.get(reaction.emoji);
      if (existing) {
        existing.count += 1;
        if (reaction.userId === currentUserId) {
          existing.reactedByCurrentUser = true;
        }
        return;
      }

      groupedReactions.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        reactedByCurrentUser: reaction.userId === currentUserId,
      });
    });

    return Array.from(groupedReactions.values());
  }
}
