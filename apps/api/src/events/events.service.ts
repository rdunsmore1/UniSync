import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { EventRsvpStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../common/request-with-user";
import { PrismaService } from "../database/prisma.service";
import { OrganizationsService } from "../organizations/organizations.service";
import { CreateEventDto } from "./dto/create-event.dto";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async listEvents(user: AuthenticatedUser) {
    const items = await this.prisma.event.findMany({
      where: {
        universityId: user.universityId,
        startsAt: {
          gte: new Date(),
        },
      },
      include: {
        organization: true,
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
      orderBy: { startsAt: "asc" },
    });

    return {
      items: await Promise.all(
        items.map(async (event) => {
          const role = await this.organizationsService.getOrganizationRole(
            user.id,
            event.organizationId,
          );

          const going = event.rsvps.filter((rsvp) => rsvp.status === "GOING");
          const interested = event.rsvps.filter(
            (rsvp) => rsvp.status === "INTERESTED",
          );
          const notGoing = event.rsvps.filter(
            (rsvp) => rsvp.status === "NOT_GOING",
          );
          const currentUserRsvp =
            event.rsvps.find((rsvp) => rsvp.userId === user.id)?.status ?? null;

          return {
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            capacity: event.capacity,
            organization: {
              id: event.organization.id,
              name: event.organization.name,
              slug: event.organization.slug,
            },
            currentUserRsvp,
            rsvpCounts: {
              going: going.length,
              interested: interested.length,
              notGoing: notGoing.length,
            },
            isPast: event.startsAt < new Date(),
            isFull: typeof event.capacity === "number" && going.length >= event.capacity,
            attendeePreview:
              role && ["OWNER", "ADMIN"].includes(role)
                ? going.slice(0, 8).map((rsvp) => ({
                    userId: rsvp.userId,
                    name: `${rsvp.user.firstName} ${rsvp.user.lastName}`,
                  }))
                : [],
          };
        }),
      ),
    };
  }

  async createEvent(
    user: AuthenticatedUser,
    organizationId: string,
    dto: CreateEventDto,
  ) {
    const role = await this.organizationsService.getOrganizationRole(
      user.id,
      organizationId,
    );

    if (!role || !["OWNER", "ADMIN"].includes(role)) {
      throw new ForbiddenException(
        "Only organization owners and admins can create events.",
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found.");
    }

    const event = await this.prisma.event.create({
      data: {
        organizationId,
        universityId: organization.universityId,
        createdById: user.id,
        title: dto.title.trim(),
        slug: dto.title.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
        description: dto.description.trim(),
        location: dto.location,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });

    await this.organizationsService.recalculateOrganizationState(organizationId);

    return { item: event };
  }

  async rsvp(
    user: AuthenticatedUser,
    eventId: string,
    status: EventRsvpStatus,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: true,
        rsvps: true,
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found.");
    }

    if (event.universityId !== user.universityId) {
      throw new ForbiddenException("This event belongs to a different university.");
    }

    if (event.startsAt < new Date()) {
      throw new ForbiddenException("You cannot RSVP to an event that has already started.");
    }

    const existingRsvp = event.rsvps.find((rsvp) => rsvp.userId === user.id);
    const currentGoingCount = event.rsvps.filter(
      (rsvp) => rsvp.status === "GOING",
    ).length;
    const capacityReached =
      typeof event.capacity === "number" &&
      currentGoingCount >= event.capacity &&
      existingRsvp?.status !== "GOING";

    if (status === "GOING" && capacityReached) {
      throw new ForbiddenException("This event is already full.");
    }

    await this.prisma.eventRsvp.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
      update: {
        status,
      },
      create: {
        eventId,
        userId: user.id,
        status,
      },
    });

    const updatedRsvps = await this.prisma.eventRsvp.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const role = await this.organizationsService.getOrganizationRole(
      user.id,
      event.organizationId,
    );

    return {
      eventId,
      currentUserRsvp: status,
      confirmationMessage:
        status === "GOING"
          ? "You are going to this event."
          : status === "INTERESTED"
            ? "Marked as interested."
            : "You are no longer planning to attend.",
      rsvpCounts: {
        going: updatedRsvps.filter((rsvp) => rsvp.status === "GOING").length,
        interested: updatedRsvps.filter((rsvp) => rsvp.status === "INTERESTED").length,
        notGoing: updatedRsvps.filter((rsvp) => rsvp.status === "NOT_GOING").length,
      },
      attendeePreview:
        role && ["OWNER", "ADMIN"].includes(role)
          ? updatedRsvps
              .filter((rsvp) => rsvp.status === "GOING")
              .slice(0, 8)
              .map((rsvp) => ({
                userId: rsvp.userId,
                name: `${rsvp.user.firstName} ${rsvp.user.lastName}`,
              }))
          : [],
      isFull:
        typeof event.capacity === "number"
          ? updatedRsvps.filter((rsvp) => rsvp.status === "GOING").length >=
            event.capacity
          : false,
    };
  }
}
