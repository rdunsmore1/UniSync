import { VerifyEmailClient } from "../../components/auth/verify-email-client";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <section className="auth-card">
        <div>
          <p className="eyebrow">Verification</p>
          <h2>Missing verification token</h2>
        </div>
      </section>
    );
  }

  return <VerifyEmailClient token={token} email={email} />;
}
