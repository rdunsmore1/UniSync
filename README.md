# UniSync

UniSync is a university-scoped community platform for campus organizations, events, and tutoring.

## Architecture

- `apps/web`: Next.js frontend with a mobile-first student dashboard and organization management UI.
- `apps/api`: NestJS backend with domain modules for authentication, organizations, permissions, messaging, events, and tutors.
- `packages/db`: Prisma schema and migrations targeting PostgreSQL.
- `packages/types`: Shared TypeScript types between frontend and backend.
- `packages/ui`: Shared campus design system primitives.

## Key Product Rules

- Users must register with a verified university email domain.
- Every user is assigned to a university after email domain resolution.
- Discovery is scoped by university.
- Organizations are never called servers or channels. They use organizations, rooms, and sub-rooms.
- Any verified student can create an organization.
- New organizations start `UNLISTED`.
- An organization becomes `LISTED` when it reaches the listing threshold or publishes at least one event.
- Organizations with repeated reports move to `AUTO_HIDDEN` until reviewed.

## Visibility And Moderation Defaults

- `DEFAULT_LISTING_MEMBER_THRESHOLD=8`
- `LISTED` when `memberCount >= threshold` or `eventCount >= 1`
- `AUTO_HIDDEN` when `openReportCount >= 3`
- unique reporter constraint prevents one account from spamming reports

## Run Locally

1. Install `pnpm` and PostgreSQL.
2. Copy `.env.example` to `.env` and update the database credentials.
3. Install dependencies with `pnpm install`.
4. Generate Prisma client with `pnpm db:generate`.
5. Run migrations with `pnpm db:migrate`.
6. Seed local data with `pnpm db:seed`.
7. Start the apps with `pnpm dev`.

## Local Auth Test Flow

Use these seeded credentials after running the seed script:

- `owner@lakeview.edu` / `Password123!`
- `tutor@lakeview.edu` / `Password123!`

Or test the full sign-up flow:

1. Open `/signup`.
2. Register with a seeded university domain such as `yourname@lakeview.edu`.
3. In development, the API returns a verification token and the frontend routes you to `/verify-email`.
4. Verify the email inside the app.
5. You will be signed in automatically and redirected to `/dashboard`.
6. Visit `/organizations`, create a new organization, and join one.
7. Visit an organization manage page as the owner and create a room or event.
8. Leave the app idle long enough for the access token to expire, then navigate again. The frontend should refresh the session automatically if the refresh cookie is still valid.

## Docs

- [Architecture](./docs/architecture.md)
- [Auth flow](./docs/auth-flow.md)
- [API surface](./docs/api-surface.md)

## MVP Surface

- Auth with school-domain verification
- University-scoped organization discovery
- Role-based organization management
- Room and sub-room messaging
- Tutor profiles and direct messaging
- Events and RSVP flows
- Lightweight reporting and auto-hiding
