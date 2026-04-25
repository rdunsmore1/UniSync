import { LoginForm } from "../../../components/auth/login-form";

export default function LoginPage() {
  return (
    <section className="auth-card">
      <div>
        <p className="eyebrow">Welcome back</p>
        <h2>Sign in with your university account</h2>
        <p className="auth-text">
          Access your campus dashboard, organization rooms, events, and tutor
          messages.
        </p>
      </div>
      <LoginForm />
    </section>
  );
}
