# Authentication Flow

## Token strategy

UniSync uses a hybrid session model:

- short-lived access JWT in `unisync_access`
- rotating opaque refresh token in `unisync_refresh`
- refresh token hashes stored in the `sessions` table

Both cookies are `HttpOnly` and sent automatically by the browser with `credentials: "include"`.

## Signup and verification

1. User signs up with a recognized university email domain.
2. Backend creates the user in an unverified state.
3. Backend creates an email verification token.
4. In local development, the verification token is returned in the response so the flow can be tested without SMTP.
5. After verification, the backend marks the user verified and issues auth cookies.

## Login and refresh

1. Verified user logs in with email and password.
2. Backend validates credentials and issues auth cookies.
3. Frontend calls protected API routes with `credentials: "include"`.
4. If a protected request returns `401`, the frontend calls `POST /api/auth/refresh`.
5. On successful refresh, the request is retried automatically.

## Protected route behavior

- Backend: global auth guard validates the access token and attaches the current user to the request.
- Frontend: `middleware.ts` redirects visitors without auth cookies away from protected routes.
- Frontend pages also perform live session checks and redirect to `/login` if the session cannot be recovered.

## Role enforcement

Permissions are enforced on the backend:

- `OWNER`
  - change roles
  - manage organization settings
  - create rooms
  - create events
- `ADMIN`
  - manage organization settings
  - create rooms
  - create events
- `MEMBER`
  - join organizations
  - access organization rooms
  - RSVP to events

Frontend controls are shown or hidden based on the role returned by the API, but the backend remains the source of truth.
