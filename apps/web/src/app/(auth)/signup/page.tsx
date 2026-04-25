import { SignUpForm } from "../../../components/auth/signup-form";

export default function SignUpPage() {
  return (
    <section className="auth-card">
      <div>
        <p className="eyebrow">Join your campus</p>
        <h2>Create a verified student account</h2>
        <p className="auth-text">
          We detect your university from your school email and only show
          organizations, events, and tutors tied to that campus.
        </p>
      </div>
      <SignUpForm />
    </section>
  );
}
