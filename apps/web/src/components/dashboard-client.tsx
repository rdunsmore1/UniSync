"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Stat } from "@unisync/ui";
import { apiFetch } from "../lib/api";
import { AddOrganizationCard } from "./add-organization-card";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";

interface DashboardData {
  profile: {
    firstName: string;
    lastName: string;
  };
  stats: {
    organizationsJoined: number;
    upcomingEvents: number;
    tutorProfileActive: boolean;
    recentRoomMessages: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    role: string;
  }>;
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>("/me/dashboard", { cache: "no-store" }).then(setData);
  }, []);

  return (
    <ProtectedPage>
      <SiteShell>
        <section className="page-intro">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>
              {data
                ? `${data.profile.firstName}, here is your campus activity`
                : "Loading your campus activity..."}
            </h2>
            <p className="muted">
              Stay on top of your organizations, upcoming commitments, and the spaces that matter most across campus.
            </p>
          </div>
        </section>

        <div className="stat-grid wide">
          <Stat
            label="Organizations joined"
            value={String(data?.stats.organizationsJoined ?? 0)}
          />
          <Stat label="Upcoming events" value={String(data?.stats.upcomingEvents ?? 0)} />
          <Stat
            label="Tutor profile active"
            value={data?.stats.tutorProfileActive ? "Yes" : "No"}
          />
          <Stat
            label="Room messages"
            value={String(data?.stats.recentRoomMessages ?? 0)}
          />
        </div>

        <section className="page-section">
          <div className="card-grid">
            <Card title="Start a club" eyebrow="New organization">
              <p>
                Open the guided creation page when you are ready to launch a new student group.
              </p>
              <a className="ui-button ui-button-secondary" href="/organizations/create">
                Go to creation page
              </a>
            </Card>
          </div>
        </section>

        <section className="page-section">
          <div className="section-heading">
            <p className="eyebrow">Your organizations</p>
            <h3>Where you are already involved</h3>
          </div>
          <div className="card-grid">
            {data?.organizations.map((organization) => (
              <Link
                className="dashboard-organization-card-link ui-hover-accent"
                href={`/organizations/${organization.slug}`}
                key={organization.id}
              >
                <Card
                  action={<span className="club-name-pill">{organization.name}</span>}
                  eyebrow={organization.role}
                >
                  <p className="card-description">{organization.description}</p>
                  <div className="meta-chip-row">
                    <span className="meta-chip meta-chip-soft">{organization.role}</span>
                    <span className="meta-chip meta-chip-soft">Member space</span>
                  </div>
                </Card>
              </Link>
            ))}
            <AddOrganizationCard />
          </div>
        </section>
      </SiteShell>
    </ProtectedPage>
  );
}
