"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useSession } from "../lib/session";

export function ProtectedPage({ children }: PropsWithChildren) {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session?.authenticated) {
      router.replace("/login");
    }
  }, [loading, router, session?.authenticated]);

  if (loading || !session?.authenticated) {
    return <section className="loading-card">Loading your campus data...</section>;
  }

  return <>{children}</>;
}
