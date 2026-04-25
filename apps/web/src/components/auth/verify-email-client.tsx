"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "../../lib/api";

export function VerifyEmailClient({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setPending(true);
    setError(null);

    try {
      await postJson("/auth/verify-email", { token });
      router.replace("/dashboard");
      router.refresh();
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Unable to verify your email.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="auth-card">
      <div>
        <p className="eyebrow">Verify your account</p>
        <h2>Confirm {email}</h2>
        <p className="auth-text">
          In local development, verification is completed directly in the app so
          you can test the full auth flow without external email delivery.
        </p>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="ui-button ui-button-primary" disabled={pending} onClick={handleVerify} type="button">
        {pending ? "Verifying..." : "Verify email"}
      </button>
    </section>
  );
}
