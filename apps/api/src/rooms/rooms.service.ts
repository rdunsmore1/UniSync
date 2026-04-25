import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../common/request-with-user";
import { PrismaService } from "../database/prisma.service";
import { OrganizationsService } from "../organizations/organizations.service";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";

function slugifyRoomName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async getRoom(user: AuthenticatedUser, roomId: string) {
    const room = (await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: user.id },
            },
          },
        },
        parentRoom: true,
        subRooms: {
          orderBy: { sortOrder: "asc" },
        },
        messages: {
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
        },
      },
    } as any)) as any;

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

    return {
      id: room.id,
      name: room.name,
      slug: room.slug,
      topic: room.topic,
      description: room.description,
      organization: {
        id: room.organization.id,
        name: room.organization.name,
        slug: room.organization.slug,
      },
      currentUserId: user.id,
      currentUserRole: membership?.role ?? null,
      parentRoom: room.parentRoom
        ? {
            id: room.parentRoom.id,
            name: room.parentRoom.name,
          }
        : null,
      subRooms: room.subRooms.map((subRoom: any) => ({
        id: subRoom.id,
        name: subRoom.name,
        slug: subRoom.slug,
        topic: subRoom.topic,
      })),
      messages: room.messages.map((message: any) => ({
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
        reactions: Array.from(
          message.reactions.reduce((groups: any, reaction: any) => {
            const existing = groups.get(reaction.emoji);
            if (existing) {
              existing.count += 1;
              if (reaction.userId === user.id) {
                existing.reactedByCurrentUser = true;
              }
              return groups;
            }

            groups.set(reaction.emoji, {
              emoji: reaction.emoji,
              count: 1,
              reactedByCurrentUser: reaction.userId === user.id,
            });

            return groups;
          }, new Map<string, { emoji: string; count: number; reactedByCurrentUser: boolean }>())
          .values(),
        ),
      })),
    };
  }

  async createRoom(
    user: AuthenticatedUser,
    organizationId: string,
    dto: CreateRoomDto,
  ) {
    await this.assertRoomManagementRole(user.id, organizationId);

    const room = await this.prisma.room.create({
      data: {
        organizationId,
        sectionId: dto.sectionId,
        parentRoomId: dto.parentRoomId,
        name: dto.name.trim(),
        slug: dto.slug?.trim().toLowerCase() || slugifyRoomName(dto.name),
        topic: dto.name.trim(),
        isPrivate: dto.isPrivate ?? false,
      },
    });

    return { item: room };
  }

  async updateRoom(user: AuthenticatedUser, roomId: string, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException("Room not found.");
    }

    await this.assertRoomManagementRole(user.id, room.organizationId);

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim().toLowerCase(),
        sectionId: dto.sectionId,
        parentRoomId: dto.parentRoomId,
        isPrivate: dto.isPrivate,
      },
    });

    return { item: updated };
  }

  async deleteRoom(user: AuthenticatedUser, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException("Room not found.");
    }

    await this.assertRoomManagementRole(user.id, room.organizationId);
    await this.prisma.room.delete({ where: { id: roomId } });

    return { deleted: true };
  }

  private async assertRoomManagementRole(userId: string, organizationId: string) {
    const role = await this.organizationsService.getOrganizationRole(
      userId,
      organizationId,
    );

    if (!role || !["OWNER", "ADMIN"].includes(role)) {
      throw new ForbiddenException(
        "Only organization owners and admins can manage rooms.",
      );
    }
  }
}
