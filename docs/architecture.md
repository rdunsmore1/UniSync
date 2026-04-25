# UniSync Architecture

## Monorepo Layout

```text
UniSync/
  apps/
    api/        # NestJS backend
    web/        # Next.js frontend
  packages/
    db/         # Prisma schema and migrations
    types/      # Shared TypeScript types
    ui/         # Shared UI primitives
  docs/
    architecture.md
```

## Backend Modules

- `auth`: sign up, login, logout, email verification, session lookup
- `universities`: university and email-domain resolution
- `users`: current-user profile access
- `organizations`: organization CRUD, member role changes, reporting
- `rooms`: room and sub-room CRUD
- `messages`: room messaging and direct tutor/student messaging
- `events`: event creation and RSVP
- `tutors`: tutor profile management and conversation entry

## Frontend Pages

- `/signup`
- `/login`
- `/dashboard`
- `/organizations/[slug]`
- `/organizations/[slug]/manage`
- `/events`
- `/tutors`

## Permissions Model

Roles are organization-scoped, not global.

- `OWNER`
  - assign or remove admins
  - remove members
  - edit organization profile, layout, and appearance
  - create, edit, delete, and reorder rooms and sub-rooms
  - publish events
- `ADMIN`
  - create, edit, delete, and reorder rooms and sub-rooms
  - manage sections and room layout
  - moderate members with basic controls
  - publish events
- `MEMBER`
  - view the organization
  - participate in permitted rooms
  - RSVP to events

## Visibility And Moderation Logic

- Any verified student can create an organization.
- New organizations start as `UNLISTED`.
- An organization becomes `LISTED` when:
  - it reaches `DEFAULT_LISTING_MEMBER_THRESHOLD`, or
  - it publishes at least one event
- Members can report organizations one time each.
- Three open reports automatically move an organization to `AUTO_HIDDEN`.
- Manual review can later dismiss reports or keep the organization hidden.

This approach keeps moderation lightweight while still protecting the discovery experience.
