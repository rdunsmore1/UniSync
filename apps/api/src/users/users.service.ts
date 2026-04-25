import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../common/request-with-user";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        university: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      university: user.university,
      isEmailVerified: user.isEmailVerified,
    };
  }

  async getDashboard(user: AuthenticatedUser) {
    const [memberships, upcomingEvents, upcomingRsvps, tutorProfile, unreadRooms] =
      await Promise.all([
      this.prisma.organizationMembership.findMany({
        where: { userId: user.id },
        include: {
          organization: true,
        },
        orderBy: { joinedAt: "desc" },
      }),
      this.prisma.event.findMany({
        where: {
          universityId: user.universityId,
          startsAt: {
            gte: new Date(),
          },
        },
        include: {
          organization: true,
        },
        orderBy: { startsAt: "asc" },
        take: 5,
      }),
      this.prisma.eventRsvp.findMany({
        where: {
          userId: user.id,
          status: {
            in: ["GOING", "INTERESTED"],
          },
          event: {
            startsAt: {
              gte: new Date(),
            },
          },
        },
      }),
      this.prisma.tutorProfile.findUnique({
        where: { userId: user.id },
        include: {
          subjects: true,
        },
      }),
      this.prisma.roomMessage.count({
        where: {
          room: {
            organization: {
              memberships: {
                some: { userId: user.id },
              },
            },
          },
        },
      }),
      ]);

    return {
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      stats: {
        organizationsJoined: memberships.length,
        upcomingEvents: upcomingRsvps.length,
        tutorProfileActive: Boolean(tutorProfile),
        recentRoomMessages: unreadRooms,
      },
      organizations: memberships.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        description: membership.organization.description,
        role: membership.role,
        visibilityStatus: membership.organization.visibilityStatus,
      })),
      upcomingEvents,
    };
  }
}
