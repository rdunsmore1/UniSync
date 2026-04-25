import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class UniversitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.university.findMany({
      include: {
        domains: true,
      },
      orderBy: { name: "asc" },
    });

    return { items };
  }
}
