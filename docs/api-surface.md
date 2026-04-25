# Core API Endpoints

All protected endpoints require the auth cookies set by login or verification.

## Response conventions

- Success responses return JSON objects.
- Validation or auth failures return standard NestJS error JSON with a `message`.
- Protected frontend requests send cookies automatically via `credentials: "include"`.

## Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/verify-email`
- `POST /api/auth/refresh`
- `GET /api/auth/session`

### `POST /api/auth/signup`

Auth: Public

Request body:

```json
{
  "firstName": "Avery",
  "lastName": "Morgan",
  "email": "owner@lakeview.edu",
  "password": "Password123!"
}
```

Success response:

```json
{
  "message": "Account created. Verify your university email to continue.",
  "pendingEmail": "owner@lakeview.edu",
  "detectedDomain": "lakeview.edu",
  "verificationToken": "development-only-token"
}
```

### `POST /api/auth/login`

Auth: Public

Request body:

```json
{
  "email": "owner@lakeview.edu",
  "password": "Password123!"
}
```

Success response:

```json
{
  "message": "Login successful.",
  "user": {
    "id": "user_id",
    "email": "owner@lakeview.edu",
    "universityId": "university_id",
    "firstName": "Avery",
    "lastName": "Morgan",
    "isEmailVerified": true
  }
}
```

### `POST /api/auth/verify-email`

Auth: Public

Request body:

```json
{
  "token": "development-only-token"
}
```

Success response: same shape as login, and auth cookies are issued.

### `POST /api/auth/refresh`

Auth: Public, requires refresh cookie

Request body:

```json
{}
```

Success response:

```json
{
  "message": "Session refreshed.",
  "user": {
    "id": "user_id",
    "email": "owner@lakeview.edu",
    "universityId": "university_id",
    "firstName": "Avery",
    "lastName": "Morgan",
    "isEmailVerified": true
  }
}
```

### `GET /api/auth/session`

Auth: Optional

Success response:

```json
{
  "authenticated": true,
  "user": {
    "id": "user_id",
    "email": "owner@lakeview.edu",
    "universityId": "university_id",
    "firstName": "Avery",
    "lastName": "Morgan",
    "isEmailVerified": true
  }
}
```

## User And University

- `GET /api/me`
- `GET /api/me/dashboard`
- `GET /api/universities`

## Organizations

- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/organizations/:slug`
- `POST /api/organizations/:id/join`
- `PATCH /api/organizations/:id`
- `PATCH /api/organizations/:id/members/:userId/role`
- `DELETE /api/organizations/:id/members/:userId`
- `POST /api/organizations/:id/reports`

### `POST /api/organizations`

Auth: Required

Request body:

```json
{
  "name": "Pre-Law Society",
  "slug": "pre-law-society",
  "description": "Connect with aspiring legal professionals.",
  "category": "Academic"
}
```

Success response:

```json
{
  "item": {
    "id": "organization_id",
    "name": "Pre-Law Society",
    "visibilityStatus": "UNLISTED"
  },
  "listingRules": {
    "minimumMembers": 8,
    "becomesListedAfterFirstEvent": true,
    "autoHideAfterReports": 3
  }
}
```

### `POST /api/organizations/:id/join`

Auth: Required

Request body:

```json
{}
```

Success response:

```json
{
  "success": true
}
```

## Rooms And Messages

- `POST /api/organizations/:organizationId/rooms`
- `PATCH /api/rooms/:roomId`
- `DELETE /api/rooms/:roomId`
- `GET /api/rooms/:roomId/messages`
- `POST /api/rooms/:roomId/messages`

### `POST /api/organizations/:organizationId/rooms`

Auth: Required, `OWNER` or `ADMIN`

Request body:

```json
{
  "name": "Announcements",
  "slug": "announcements",
  "sectionId": null,
  "parentRoomId": null,
  "isPrivate": false
}
```

## Tutor Messaging

- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`
- `POST /api/tutors/:id/contact`

## Events

- `GET /api/events`
- `POST /api/organizations/:organizationId/events`
- `POST /api/events/:eventId/rsvp`

### `POST /api/organizations/:organizationId/events`

Auth: Required, `OWNER` or `ADMIN`

Request body:

```json
{
  "title": "Career in Public Interest Law",
  "description": "Panel featuring alumni working in legal aid and advocacy.",
  "startsAt": "2026-04-10T18:30:00.000Z",
  "location": "Student Union 214"
}
```

## Tutors

- `GET /api/tutors`
- `POST /api/tutors/profile`
