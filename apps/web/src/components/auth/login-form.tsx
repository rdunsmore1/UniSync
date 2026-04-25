"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "../../lib/api";

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

    try {
      await postJson<LoginResponse>("/auth/login", {
        email: formData.get("email"),
        password: formData.get("password"),
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
    >
      <label>
        University email
        <input name="email" type="email" placeholder="name@school.edu" required />
      </label>
      <label>
        Password
        <input name="password" type="password" placeholder="Enter your password" required />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="ui-button ui-button-primary" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
