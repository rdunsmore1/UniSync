import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  OrganizationRole,
  OrganizationVisibilityStatus,
} from "@prisma/client";
import type { AuthenticatedUser } from "../common/request-with-user";
import { PrismaService } from "../database/prisma.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import {
  ORGANIZATION_ACCESS_MODES,
  ORGANIZATION_CATEGORIES,
  slugifyOrganizationName,
} from "./organization.constants";

const DEFAULT_LISTING_MEMBER_THRESHOLD = Number(
  process.env.DEFAULT_LISTING_MEMBER_THRESHOLD ?? 8,
);
const AUTO_HIDE_REPORT_THRESHOLD = 3;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrganizations(user: AuthenticatedUser) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        universityId: user.universityId,
        OR: [
          { visibilityStatus: "LISTED" },
          {
            memberships: {
              some: {
                userId: user.id,
              },
            },
          },
          { ownerId: user.id },
        ],
      },
      include: {
        memberships: {
          where: { userId: user.id },
        },
        events: {
          where: {
            startsAt: {
              gte: new Date(),
            },
          },
          orderBy: { startsAt: "asc" },
          take: 1,
        },
      },
      orderBy: [{ visibilityStatus: "asc" }, { memberCountCache: "desc" }],
    });

    return {
      items: organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        category: organization.category,
        accessMode: organization.accessMode,
        tags: organization.tags,
        visibilityStatus: organization.visibilityStatus,
        memberCount: organization.memberCountCache,
        eventCount: organization.eventCountCache,
        nextEvent: organization.events[0] ?? null,
        currentUserRole: organization.memberships[0]?.role ?? null,
      })),
    };
  }

  async createOrganization(user: AuthenticatedUser, dto: CreateOrganizationDto) {
    const slug = slugifyOrganizationName(dto.name);
    const organization = await this.prisma.organization.create({
      data: {
        universityId: user.universityId,
        ownerId: user.id,
        name: dto.name.trim(),
        slug,
        description: dto.description.trim(),
        category: dto.category.trim(),
        accessMode: dto.accessMode,
        bannerUrl: dto.bannerUrl,
        visibilityStatus: "UNLISTED",
        memberCountCache: 1,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    return {
      item: organization,
      listingRules: this.getListingRules(),
    };
  }

  async getOrganizationBySlug(user: AuthenticatedUser, slug: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        universityId: user.universityId,
        slug,
      },
      include: {
        rooms: {
          where: {
            parentRoomId: null,
            sectionId: null,
          },
          orderBy: { sortOrder: "asc" },
          include: {
            subRooms: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            rooms: {
              where: {
                parentRoomId: null,
                NOT: {
                  sectionId: null,
                },
              },
              orderBy: { sortOrder: "asc" },
              include: {
                subRooms: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
        events: {
          where: {
            startsAt: {
              gte: new Date(),
            },
          },
          orderBy: { startsAt: "asc" },
          include: {
            rsvps: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found.");
    }

    if (
      organization.visibilityStatus === "AUTO_HIDDEN" &&
      organization.ownerId !== user.id
    ) {
      throw new NotFoundException("Organization not found.");
    }

    const membership = organization.memberships.find(
      (entry) => entry.userId === user.id,
    );

    if (
      organization.visibilityStatus === "UNLISTED" &&
      !membership &&
      organization.ownerId !== user.id
    ) {
      throw new NotFoundException("Organization not found.");
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.description,
      category: organization.category,
      accessMode: organization.accessMode,
      tags: organization.tags,
      visibilityStatus: organization.visibilityStatus,
      memberCount: organization.memberCountCache,
      eventCount: organization.eventCountCache,
      currentUserRole: membership?.role ?? null,
      listingRules: this.getListingRules(),
      moderationSummary: {
        openReportCount: organization.openReportCountCache,
        autoHideThreshold: AUTO_HIDE_REPORT_THRESHOLD,
      },
      unsectionedRooms: organization.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        slug: room.slug,
        topic: room.topic,
        subRooms: room.subRooms.map((subRoom) => ({
          id: subRoom.id,
          name: subRoom.name,
          slug: subRoom.slug,
          topic: subRoom.topic,
        })),
      })),
      sections: organization.sections.map((section) => ({
        id: section.id,
        name: section.name,
        description: section.description,
        rooms: section.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          slug: room.slug,
          topic: room.topic,
          subRooms: room.subRooms.map((subRoom) => ({
            id: subRoom.id,
            name: subRoom.name,
            slug: subRoom.slug,
            topic: subRoom.topic,
          })),
        })),
      })),
      members: organization.memberships.map((entry) => ({
        userId: entry.userId,
        role: entry.role,
        joinedAt: entry.joinedAt,
        name: `${entry.user.firstName} ${entry.user.lastName}`,
        email: entry.user.email,
      })),
      upcomingEvents: organization.events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        capacity: event.capacity,
        currentUserRsvp:
          event.rsvps.find((rsvp) => rsvp.userId === user.id)?.status ?? null,
        rsvpCounts: {
          going: event.rsvps.filter((rsvp) => rsvp.status === "GOING").length,
          interested: event.rsvps.filter((rsvp) => rsvp.status === "INTERESTED").length,
          notGoing: event.rsvps.filter((rsvp) => rsvp.status === "NOT_GOING").length,
        },
        attendeePreview: event.rsvps
          .filter((rsvp) => rsvp.status === "GOING")
          .slice(0, 8)
          .map((rsvp) => ({
            userId: rsvp.userId,
            name: `${rsvp.user.firstName} ${rsvp.user.lastName}`,
          })),
      })),
    };
  }

  async joinOrganization(user: AuthenticatedUser, organizationId: string) {
    const organization = await this.requireOrganization(organizationId);
    this.assertSameUniversity(user, organization.universityId);

    await this.prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        organizationId,
        userId: user.id,
        role: organization.accessMode === "OPEN" ? "MEMBER" : "VIEWER",
      },
    });

    await this.recalculateOrganizationState(organizationId);

    return {
      success: true,
    };
  }

  async updateOrganization(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateOrganizationDto,
  ) {
    const organization = await this.requireOrganization(id);
    const requesterRole = await this.requireMembershipRole(user.id, id);

    if (!["OWNER", "ADMIN"].includes(requesterRole)) {
      throw new ForbiddenException("Only owners and admins can edit organizations.");
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.name ? slugifyOrganizationName(dto.name) : undefined,
        description: dto.description?.trim(),
        category: dto.category?.trim(),
        accessMode: dto.accessMode,
        bannerUrl: dto.bannerUrl,
      },
    });

    return {
      item: updated,
      visibilityStatus: organization.visibilityStatus,
    };
  }

  async updateMemberRole(
    user: AuthenticatedUser,
    organizationId: string,
    targetUserId: string,
    role: OrganizationRole,
  ) {
    const organization = await this.requireOrganization(organizationId);
    const requesterRole = await this.requireMembershipRole(user.id, organizationId);

    if (requesterRole !== "OWNER") {
      throw new ForbiddenException("Only owners can change organization roles.");
    }

    if (organization.ownerId === targetUserId && role !== "OWNER") {
      throw new ForbiddenException("Transfer ownership before changing the owner role.");
    }

    const updated = await this.prisma.organizationMembership.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
      data: { role },
    });

    return {
      item: updated,
    };
  }

  async removeMember(
    user: AuthenticatedUser,
    organizationId: string,
    targetUserId: string,
  ) {
    const organization = await this.requireOrganization(organizationId);
    const requesterRole = await this.requireMembershipRole(user.id, organizationId);

    if (!["OWNER", "ADMIN"].includes(requesterRole)) {
      throw new ForbiddenException("Only owners and admins can remove members.");
    }

    if (organization.ownerId === targetUserId) {
      throw new ForbiddenException("The owner cannot be removed from the organization.");
    }

    await this.prisma.organizationMembership.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    await this.recalculateOrganizationState(organizationId);

    return {
      removed: true,
    };
  }

  async updateOrganizationTags(
    user: AuthenticatedUser,
    organizationId: string,
    tags: string[],
  ) {
    const requesterRole = await this.requireMembershipRole(user.id, organizationId);
    if (!["OWNER", "ADMIN"].includes(requesterRole)) {
      throw new ForbiddenException("Only owners and admins can edit organization tags.");
    }

    const cleanedTags = Array.from(
      new Set(
        tags
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 12),
      ),
    );

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        tags: cleanedTags,
      },
    });

    return { item: updated };
  }

  async reportOrganization(
    user: AuthenticatedUser,
    organizationId: string,
    dto: CreateReportDto,
  ) {
    const organization = await this.requireOrganization(organizationId);
    this.assertSameUniversity(user, organization.universityId);

    const report = await this.prisma.organizationReport.upsert({
      where: {
        organizationId_reporterUserId: {
          organizationId,
          reporterUserId: user.id,
        },
      },
      update: {
        reason: dto.reason,
        details: dto.details,
        status: "OPEN",
        reviewedAt: null,
      },
      create: {
        organizationId,
        reporterUserId: user.id,
        reason: dto.reason,
        details: dto.details,
      },
    });

    const state = await this.recalculateOrganizationState(organizationId);

    return {
      item: report,
      moderationOutcome: {
        currentStatus: state.visibilityStatus,
        openReportCount: state.openReportCountCache,
        autoHideAfterReports: AUTO_HIDE_REPORT_THRESHOLD,
      },
    };
  }

  async getOrganizationRole(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return membership?.role ?? null;
  }

  async recalculateOrganizationState(organizationId: string) {
    const [memberCount, eventCount, openReportCount, organization] = await Promise.all([
      this.prisma.organizationMembership.count({ where: { organizationId } }),
      this.prisma.event.count({
        where: {
          organizationId,
          isPublished: true,
        },
      }),
      this.prisma.organizationReport.count({
        where: {
          organizationId,
          status: "OPEN",
        },
      }),
      this.requireOrganization(organizationId),
    ]);

    const visibilityStatus = this.calculateVisibilityStatus(
      organization.visibilityStatus,
      memberCount,
      eventCount,
      openReportCount,
    );

    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        memberCountCache: memberCount,
        eventCountCache: eventCount,
        openReportCountCache: openReportCount,
        reportScoreCache: openReportCount,
        visibilityStatus,
        listingEligibleAt:
          memberCount >= DEFAULT_LISTING_MEMBER_THRESHOLD || eventCount > 0
            ? new Date()
            : null,
        autoHiddenAt: visibilityStatus === "AUTO_HIDDEN" ? new Date() : null,
      },
    });
  }

  private calculateVisibilityStatus(
    currentStatus: OrganizationVisibilityStatus,
    memberCount: number,
    eventCount: number,
    openReportCount: number,
  ): OrganizationVisibilityStatus {
    if (currentStatus === "SUSPENDED") {
      return currentStatus;
    }

    if (openReportCount >= AUTO_HIDE_REPORT_THRESHOLD) {
      return "AUTO_HIDDEN";
    }

    if (memberCount >= DEFAULT_LISTING_MEMBER_THRESHOLD || eventCount > 0) {
      return "LISTED";
    }

    return "UNLISTED";
  }

  private async requireOrganization(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found.");
    }

    return organization;
  }

  private assertSameUniversity(user: AuthenticatedUser, universityId: string) {
    if (user.universityId !== universityId) {
      throw new ForbiddenException("This resource belongs to a different university.");
    }
  }

  private async requireMembershipRole(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException("You must join the organization first.");
    }

    return membership.role;
  }

  private getListingRules() {
    return {
      minimumMembers: DEFAULT_LISTING_MEMBER_THRESHOLD,
      becomesListedAfterFirstEvent: true,
      autoHideAfterReports: AUTO_HIDE_REPORT_THRESHOLD,
      categoryOptions: ORGANIZATION_CATEGORIES,
      accessModeOptions: ORGANIZATION_ACCESS_MODES,
    };
  }
}
