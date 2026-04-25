"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  universityId: string;
  isEmailVerified: boolean;
}

export interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
}

export function useSession() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const initial = await apiFetch<SessionResponse>("/auth/session", {
        retryOnUnauthorized: true,
        cache: "no-store",
      });

      if (initial.authenticated) {
        return initial;
      }

      try {
        await apiFetch("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({}),
          retryOnUnauthorized: false,
        });

        return apiFetch<SessionResponse>("/auth/session", {
          retryOnUnauthorized: false,
          cache: "no-store",
        });
      } catch {
        return initial;
      }
    };

    loadSession()
      .then((data) => {
        if (!active) {
          return;
        }

        setSession(data);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setSession({
          authenticated: false,
          user: null,
        });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { session, loading, setSession };
}
