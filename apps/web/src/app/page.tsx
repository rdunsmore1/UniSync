import { Button, Card, Stat } from "@unisync/ui";
import { SiteShell } from "../components/site-shell";

export default function HomePage() {
  return (
    <SiteShell>
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Built for verified campus identity</p>
          <h2>
            A professional student network for organizations, events, and
            tutoring at your university.
          </h2>
          <p className="hero-text">
            UniSync keeps every experience scoped to a real university
            community, with structured organizations, room-based discussion,
            event publishing, and tutor discovery.
          </p>
          <div className="hero-actions">
            <Button href="/signup">Create account</Button>
            <Button href="/dashboard" variant="ghost">
              Preview dashboard
            </Button>
          </div>
        </div>
        <Card title="Campus health at a glance" eyebrow="Launch dashboard">
          <div className="stat-grid">
            <Stat label="Listed organizations" value="42" />
            <Stat label="Upcoming events" value="18" />
            <Stat label="Active tutors" value="27" />
            <Stat label="Verified students" value="3.1k" />
          </div>
        </Card>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <p className="eyebrow">Discovery</p>
          <h3>Browse listed organizations after you verify your student identity</h3>
        </div>
        <div className="card-grid">
          <Card title="Verified access" eyebrow="Identity first">
            <p>Students sign in with a recognized university domain before any campus data is shown.</p>
          </Card>
          <Card title="Structured organizations" eyebrow="Not chat clutter">
            <p>Organizations use sections, rooms, and sub-rooms designed for clarity and governance.</p>
          </Card>
          <Card title="Lightweight moderation" eyebrow="Discovery quality">
            <p>New organizations start unlisted and auto-hide after repeated reports.</p>
          </Card>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <p className="eyebrow">Tutor marketplace</p>
          <h3>Find student tutors with direct, authenticated campus messaging</h3>
        </div>
        <div className="card-grid">
          <Card title="Verified tutors" eyebrow="Marketplace">
            <p>Profiles are tied to real campus accounts and scoped to the user’s university.</p>
          </Card>
          <Card title="Role-aware management" eyebrow="Organizations">
            <p>Owner and admin actions are enforced by the backend and reflected in the UI.</p>
          </Card>
        </div>
      </section>
    </SiteShell>
  );
}
