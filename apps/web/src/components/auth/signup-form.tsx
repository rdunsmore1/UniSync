"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "../../lib/api";

interface SignUpResponse {
  message: string;
  pendingEmail: string;
  verificationToken?: string;
}

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    try {
      const response = await postJson<SignUpResponse>("/auth/signup", {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        password: formData.get("password"),
      });

      if (response.verificationToken) {
        router.push(
          `/verify-email?token=${encodeURIComponent(response.verificationToken)}&email=${encodeURIComponent(response.pendingEmail)}`,
        );
        return;
      }

      router.push("/login");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create account.",
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
        First name
        <input name="firstName" type="text" placeholder="Avery" required />
      </label>
      <label>
        Last name
        <input name="lastName" type="text" placeholder="Jordan" required />
      </label>
      <label>
        University email
        <input name="email" type="email" placeholder="name@school.edu" required />
      </label>
      <label>
        Password
        <input name="password" type="password" placeholder="Create a password" required />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="ui-button ui-button-primary" type="submit" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
