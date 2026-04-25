"use client";

import { LogoutButton } from "./logout-button";
import { useSession } from "../lib/session";

export function SiteShellAuth() {
  const { session } = useSession();

  if (!session?.authenticated) {
    return (
      <>
        <a href="/login">Login</a>
        <a href="/signup">Create account</a>
      </>
    );
  }

  return (
    <>
      <span className="nav-user">
        {session.user?.firstName} {session.user?.lastName}
      </span>
      <LogoutButton />
    </>
  );
}
