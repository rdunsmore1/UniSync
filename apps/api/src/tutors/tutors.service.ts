import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../common/request-with-user";
import { PrismaService } from "../database/prisma.service";
import { UpsertTutorProfileDto } from "./dto/upsert-tutor-profile.dto";

@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTutors(user: AuthenticatedUser) {
    const items = await this.prisma.tutorProfile.findMany({
      where: {
        universityId: user.universityId,
        isActive: true,
      },
      include: {
        user: true,
        subjects: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        displayName: `${item.user.firstName} ${item.user.lastName}`,
        headline: item.headline,
        description: item.description,
        subjects: item.subjects.map((subject) => subject.name),
        hourlyRate: item.hourlyRateCents ? item.hourlyRateCents / 100 : null,
        userId: item.userId,
      })),
    };
  }

  async upsertProfile(user: AuthenticatedUser, dto: UpsertTutorProfileDto) {
    const tutorProfile = await this.prisma.tutorProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: dto.headline.trim(),
        description: dto.description.trim(),
        hourlyRateCents: dto.hourlyRateCents ?? null,
        availability: {},
        isActive: true,
        subjects: {
          deleteMany: {},
          create: dto.subjects.map((subject) => ({ name: subject })),
        },
      },
      create: {
        userId: user.id,
        universityId: user.universityId,
        headline: dto.headline.trim(),
        description: dto.description.trim(),
        hourlyRateCents: dto.hourlyRateCents ?? null,
        availability: {},
        subjects: {
          create: dto.subjects.map((subject) => ({ name: subject })),
        },
      },
      include: {
        subjects: true,
      },
    });

    return { item: tutorProfile };
  }

  async contactTutor(user: AuthenticatedUser, tutorProfileId: string) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
    });

    if (!tutorProfile) {
      throw new NotFoundException("Tutor profile not found.");
    }

    if (tutorProfile.universityId !== user.universityId) {
      throw new ForbiddenException("This tutor belongs to a different university.");
    }

    const existingConversation = await this.prisma.directConversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [user.id, tutorProfile.userId],
            },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    if (
      existingConversation &&
      existingConversation.participants.length === 2
    ) {
      return {
        conversationId: existingConversation.id,
      };
    }

    const conversation = await this.prisma.directConversation.create({
      data: {
        initiatedById: user.id,
        participants: {
          create: [{ userId: user.id }, { userId: tutorProfile.userId }],
        },
      },
    });

    return {
      conversationId: conversation.id,
    };
  }
}
