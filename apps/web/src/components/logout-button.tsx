"use client";

import { useRouter } from "next/navigation";
import { postJson } from "../lib/api";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await postJson("/auth/logout", {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="ui-button ui-button-ghost" onClick={handleLogout} type="button">
      Log out
    </button>
  );
}
