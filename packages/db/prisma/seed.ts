import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const university = await prisma.university.upsert({
    where: { slug: "lakeview-university" },
    update: {},
    create: {
      name: "Lakeview University",
      slug: "lakeview-university",
      shortName: "Lakeview",
      city: "Chicago",
      state: "IL",
      domains: {
        create: [
          { domain: "lakeview.edu", isPrimary: true },
          { domain: "students.lakeview.edu", isPrimary: false },
        ],
      },
    },
    include: {
      domains: true,
    },
  });

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@lakeview.edu" },
    update: {
      passwordHash,
      isEmailVerified: true,
    },
    create: {
      email: "owner@lakeview.edu",
      passwordHash,
      firstName: "Avery",
      lastName: "Morgan",
      isEmailVerified: true,
      universityId: university.id,
    },
  });

  const tutorUser = await prisma.user.upsert({
    where: { email: "tutor@lakeview.edu" },
    update: {
      passwordHash,
      isEmailVerified: true,
    },
    create: {
      email: "tutor@lakeview.edu",
      passwordHash,
      firstName: "Jordan",
      lastName: "Ellis",
      isEmailVerified: true,
      universityId: university.id,
    },
  });

  const organization = await prisma.organization.upsert({
    where: {
      universityId_slug: {
        universityId: university.id,
        slug: "pre-law-society",
      },
    },
    update: {
      ownerId: owner.id,
      visibilityStatus: "LISTED",
      memberCountCache: 1,
    },
    create: {
      universityId: university.id,
      ownerId: owner.id,
      name: "Pre-Law Society",
      slug: "pre-law-society",
      description:
        "Connect with aspiring legal professionals through panels, LSAT prep circles, and alumni mentorship.",
      category: "Academic",
      accessMode: "OPEN",
      tags: ["law", "career", "networking"],
      visibilityStatus: "LISTED",
      listingEligibleAt: new Date(),
      memberCountCache: 1,
      memberships: {
        create: {
          userId: owner.id,
          role: "OWNER",
        },
      },
    },
  });

  const welcomeSection = await prisma.organizationSection.upsert({
    where: {
      id: `${organization.id}-welcome`,
    },
    update: {
      name: "Welcome",
      sortOrder: 0,
    },
    create: {
      id: `${organization.id}-welcome`,
      organizationId: organization.id,
      name: "Welcome",
      sortOrder: 0,
    },
  });

  await prisma.room.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "announcements",
      },
    },
    update: {
      name: "Announcements",
      topic: "Leadership updates and deadlines",
      sectionId: welcomeSection.id,
      sortOrder: 0,
    },
    create: {
      organizationId: organization.id,
      sectionId: welcomeSection.id,
      name: "Announcements",
      slug: "announcements",
      topic: "Leadership updates and deadlines",
      sortOrder: 0,
    },
  });

  await prisma.room.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "introductions",
      },
    },
    update: {
      name: "Introductions",
      topic: "Meet new members",
      sectionId: welcomeSection.id,
      sortOrder: 1,
    },
    create: {
      organizationId: organization.id,
      sectionId: welcomeSection.id,
      name: "Introductions",
      slug: "introductions",
      topic: "Meet new members",
      sortOrder: 1,
    },
  });

  await prisma.event.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "career-in-public-interest-law",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      universityId: university.id,
      createdById: owner.id,
      title: "Career in Public Interest Law",
      slug: "career-in-public-interest-law",
      description: "Panel featuring alumni working in legal aid and advocacy.",
      location: "Student Union 214",
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  await prisma.tutorProfile.upsert({
    where: { userId: tutorUser.id },
    update: {
      headline: "Calculus I-II, statistics, and study planning",
      description: "Patient tutoring focused on mastery and exam prep.",
      hourlyRateCents: 2800,
      availability: {
        weekdays: ["Tue 4pm", "Thu 6pm"],
      },
      isActive: true,
    },
    create: {
      userId: tutorUser.id,
      universityId: university.id,
      headline: "Calculus I-II, statistics, and study planning",
      description: "Patient tutoring focused on mastery and exam prep.",
      hourlyRateCents: 2800,
      availability: {
        weekdays: ["Tue 4pm", "Thu 6pm"],
      },
      subjects: {
        create: [{ name: "Calculus" }, { name: "Statistics" }],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
