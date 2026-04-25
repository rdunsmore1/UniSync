"use client";

import { useEffect, useState } from "react";
import { Card } from "@unisync/ui";
import { apiFetch, postJson } from "../lib/api";
import { EventRsvpControls } from "./event-rsvp-controls";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";
import { TimestampText } from "./timestamp-text";

interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  accessMode: "OPEN" | "INVITE_ONLY";
  tags: string[];
  visibilityStatus: string;
  memberCount: number;
  currentUserRole: "OWNER" | "ADMIN" | "VIEWER" | "MEMBER" | null;
  unsectionedRooms: Array<{
    id: string;
    name: string;
    topic: string | null;
    subRooms: Array<{
      id: string;
      name: string;
      topic: string | null;
    }>;
  }>;
  sections: Array<{
    id: string;
    name: string;
    rooms: Array<{
      id: string;
      name: string;
      topic: string | null;
      subRooms: Array<{
        id: string;
        name: string;
        topic: string | null;
      }>;
    }>;
  }>;
  members: Array<{
    userId: string;
    role: string;
    name: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    description: string;
    location: string | null;
    startsAt: string;
    endsAt: string | null;
    capacity: number | null;
    currentUserRsvp: "GOING" | "INTERESTED" | "NOT_GOING" | null;
    rsvpCounts: {
      going: number;
      interested: number;
      notGoing: number;
    };
    attendeePreview: Array<{
      userId: string;
      name: string;
    }>;
  }>;
}

export function OrganizationDetailClient({ slug }: { slug: string }) {
  const [data, setData] = useState<OrganizationDetail | null>(null);

  async function load() {
    const response = await apiFetch<OrganizationDetail>(`/organizations/${slug}`, {
      cache: "no-store",
    });
    setData(response);
  }

  useEffect(() => {
    void load();
  }, [slug]);

  async function handleJoin() {
    if (!data) {
      return;
    }

    await postJson(`/organizations/${data.id}/join`, {});
    await load();
  }

  async function handleReport() {
    if (!data) {
      return;
    }

    await postJson(`/organizations/${data.id}/reports`, {
      reason: "OTHER",
      details: "Reported from the organization view in local testing.",
    });
    await load();
  }

  return (
    <ProtectedPage>
      <SiteShell>
        {(() => {
          const tags = data?.tags ?? [];
          const accessLabel =
            data?.accessMode === "OPEN" ? "Open to anyone" : "Invite only";
          const accessClassName =
            data?.accessMode === "OPEN"
              ? "access-pill access-pill-open"
              : "access-pill access-pill-invite";
          const roomCount =
            (data?.unsectionedRooms.length ?? 0) +
            (data?.sections.reduce((total, section) => total + section.rooms.length, 0) ?? 0);

          return (
        <section className="organization-hero">
          <div>
            <p className="eyebrow">{data?.category ?? "Organization"}</p>
            <h2>{data?.name ?? "Loading organization..."}</h2>
            <p className="hero-text">{data?.description}</p>
            <div className="organization-hero-meta">
              {data?.accessMode && <span className={accessClassName}>{accessLabel}</span>}
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
            <div className="inline-meta">
              {data?.currentUserRole ? (
                <span className="meta-chip meta-chip-soft">Your role: {data.currentUserRole}</span>
              ) : (
                <button className="ui-button ui-button-primary" onClick={handleJoin} type="button">
                  {data?.accessMode === "OPEN" ? "Join organization" : "Preview as viewer"}
                </button>
              )}
              <button className="ui-button ui-button-ghost" onClick={handleReport} type="button">
                Report organization
              </button>
              {data?.currentUserRole && ["OWNER", "ADMIN"].includes(data.currentUserRole) && (
                <a className="text-link" href={`/organizations/${slug}/manage`}>
                  Open admin interface
                </a>
              )}
            </div>
          </div>
          <Card title="Overview" eyebrow="Live data">
            <div className="overview-stat-stack">
              <div className="overview-stat">
                <strong>{data?.memberCount ?? 0}</strong>
                <span>members</span>
              </div>
              <div className="overview-stat">
                <strong>{roomCount}</strong>
                <span>rooms</span>
              </div>
              <div className="overview-stat">
                <strong>{data?.upcomingEvents.length ?? 0}</strong>
                <span>upcoming events</span>
              </div>
            </div>
            <div className="meta-chip-row">
              <span className="meta-chip meta-chip-soft">
                {data?.currentUserRole === "VIEWER"
                  ? "Viewer access to open rooms"
                  : "Structured rooms and sub-rooms"}
              </span>
            </div>
          </Card>
        </section>
          );
        })()}

        <section className="page-section">
          <div className="room-section-grid">
            {Boolean(data?.unsectionedRooms.length) && (
              <Card title="Open rooms" eyebrow="General">
                <div className="list-grid">
                  {data?.unsectionedRooms.map((room) => (
                    <a
                      className="room-link-card"
                      href={`/organizations/${slug}/rooms/${room.id}`}
                      key={room.id}
                    >
                      <strong>{room.name}</strong>
                      <span>{room.topic ?? "No topic yet"}</span>
                      {room.subRooms.map((subRoom) => (
                        <span key={subRoom.id} className="subroom-chip">
                          {subRoom.name}
                        </span>
                      ))}
                    </a>
                  ))}
                </div>
              </Card>
            )}
            {data?.sections.map((section) => (
              <Card key={section.id} title={section.name} eyebrow="Rooms">
                <div className="list-grid">
                  {section.rooms.map((room) => (
                    <a
                      className="room-link-card"
                      href={`/organizations/${slug}/rooms/${room.id}`}
                      key={room.id}
                    >
                      <strong>{room.name}</strong>
                      <span>{room.topic ?? "No topic yet"}</span>
                      {room.subRooms.map((subRoom) => (
                        <span key={subRoom.id} className="subroom-chip">
                          {subRoom.name}
                        </span>
                      ))}
                    </a>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="page-section">
          <Card title="Upcoming events" eyebrow="Organization calendar">
            <div className="list-grid">
              {data?.upcomingEvents.length ? (
                data.upcomingEvents.map((event) => (
                  <div className="event-admin-card" key={event.id}>
                    <strong>{event.title}</strong>
                    <div className="event-meta-grid">
                      <span className="meta-chip">
                        <TimestampText value={event.startsAt} />
                      </span>
                      <span className="meta-chip meta-chip-soft">
                        {event.location ?? "Location TBA"}
                      </span>
                    </div>
                    <EventRsvpControls
                      currentUserRsvp={event.currentUserRsvp}
                      eventId={event.id}
                      initialCounts={event.rsvpCounts}
                      isFull={
                        typeof event.capacity === "number" &&
                        event.rsvpCounts.going >= event.capacity
                      }
                      isPast={new Date(event.startsAt) < new Date()}
                    />
                    {Boolean(event.attendeePreview.length) &&
                      data?.currentUserRole &&
                      ["OWNER", "ADMIN"].includes(data.currentUserRole) && (
                        <div className="attendee-preview-block">
                          <strong>Attendees preview</strong>
                          <div className="attendee-preview-row">
                            {event.attendeePreview.map((attendee) => (
                              <span className="meta-chip meta-chip-soft" key={attendee.userId}>
                                {attendee.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))
              ) : (
                <p className="muted">No upcoming events posted yet.</p>
              )}
            </div>
          </Card>
        </section>

        <section className="page-section">
          <Card title="Members" eyebrow="Role visibility">
            <div className="member-list">
              {data?.members.map((member) => (
                <div className="member-row" key={member.userId}>
                  <span>{member.name}</span>
                  <span className="meta-chip meta-chip-soft">{member.role}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </SiteShell>
    </ProtectedPage>
  );
}
