"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "../../lib/api";

const TEMP_DEMO_EMAIL = "owner@lakeview.edu";
const TEMP_DEMO_PASSWORD = "Password123!";

interface LoginResponse {
  message: string;
  user: {
    id: string;
  };
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const rawEmail = String(formData.get("email") ?? "").trim();
    const rawPassword = String(formData.get("password") ?? "").trim();
    const useTemporaryBypass = rawEmail.length === 0 && rawPassword.length === 0;

    try {
      await postJson<LoginResponse>("/auth/login", {
        email: useTemporaryBypass ? TEMP_DEMO_EMAIL : rawEmail,
        password: useTemporaryBypass ? TEMP_DEMO_PASSWORD : rawPassword,
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to log in.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={async (formData) => {
        await handleSubmit(formData);
      }}
      className="form-grid"
      noValidate
    >
      <label>
        University email
        <input name="email" type="email" placeholder="name@school.edu" />
      </label>
      <label>
        Password
        <input name="password" type="password" placeholder="Enter your password" />
      </label>
      <p className="auth-text">
        Leave both fields blank to enter with the temporary demo account.
      </p>
      {error && <p className="form-error">{error}</p>}
      <button className="ui-button ui-button-primary" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
