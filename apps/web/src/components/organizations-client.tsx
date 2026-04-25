"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@unisync/ui";
import { apiFetch, postJson } from "../lib/api";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";

interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  accessMode: "OPEN" | "INVITE_ONLY";
  tags?: string[];
  visibilityStatus: string;
  memberCount: number;
  currentUserRole: "OWNER" | "ADMIN" | "VIEWER" | "MEMBER" | null;
}

interface OrganizationsResponse {
  items: OrganizationListItem[];
}

export function OrganizationsClient() {
  const [data, setData] = useState<OrganizationsResponse>({ items: [] });
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function load() {
    try {
      const response = await apiFetch<OrganizationsResponse>("/organizations", {
        cache: "no-store",
      });
      setData(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load organizations.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleJoin(id: string) {
    setJoinError(null);

    try {
      await postJson(`/organizations/${id}/join`, {});
      await load();
    } catch (joinRequestError) {
      setJoinError(
        joinRequestError instanceof Error
          ? joinRequestError.message
          : "Unable to join this organization.",
      );
    }
  }

  return (
    <ProtectedPage>
      <SiteShell>
        <section className="page-intro">
          <div>
            <p className="eyebrow">Organizations</p>
            <h2>Discovery tied to your university account</h2>
            <p className="muted">
              Browse active groups, preview how they are structured, and find communities that match your interests and goals.
            </p>
            <div className="inline-meta">
              <a className="dashboard-tab-link" href="/organizations/create">
                Start a new organization
              </a>
            </div>
          </div>
        </section>

        {error && <p className="form-error">{error}</p>}
        {joinError && <p className="form-error">{joinError}</p>}

        <section className="page-section">
          <div className="card-grid">
            {data.items.map((organization) => (
              <div className="organization-discovery-card ui-hover-accent" key={organization.id}>
                <Link
                  aria-label={`View details for ${organization.name}`}
                  className="organization-discovery-card-overlay"
                  href={`/organizations/${organization.slug}`}
                />
                <Card
                  action={<span className="club-name-pill">{organization.name}</span>}
                  eyebrow={organization.category}
                >
                  {(() => {
                    const tags = organization.tags ?? [];
                    const accessLabel =
                      organization.accessMode === "OPEN"
                        ? "Open to anyone"
                        : "Invite only";
                    const accessClassName =
                      organization.accessMode === "OPEN"
                        ? "access-pill access-pill-open"
                        : "access-pill access-pill-invite";

                    return (
                      <>
                        <div className="organization-card-meta">
                          <span className={accessClassName}>{accessLabel}</span>
                          {Boolean(tags.length) && (
                            <div className="tag-row">
                              {tags.map((tag) => (
                                <span className="tag-chip-muted" key={tag}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="card-description">{organization.description}</p>
                        <div className="meta-chip-row">
                          <span className="meta-chip">{organization.memberCount} members</span>
                          <span className="meta-chip meta-chip-soft">
                            {organization.currentUserRole
                              ? `Your role: ${organization.currentUserRole}`
                              : "You have not joined yet"}
                          </span>
                        </div>
                        {!organization.currentUserRole && (
                          <div className="organization-discovery-card-actions">
                            <button
                              className="ui-button ui-button-ghost"
                              onClick={() => void handleJoin(organization.id)}
                              type="button"
                            >
                              {organization.accessMode === "OPEN" ? "Join" : "Preview as viewer"}
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </Card>
              </div>
            ))}
          </div>
        </section>
      </SiteShell>
    </ProtectedPage>
  );
}
