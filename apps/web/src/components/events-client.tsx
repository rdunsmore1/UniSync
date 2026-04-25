"use client";

import { useEffect, useState } from "react";
import { Card } from "@unisync/ui";
import { apiFetch } from "../lib/api";
import { EventRsvpControls } from "./event-rsvp-controls";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";
import { TimestampText } from "./timestamp-text";

interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  currentUserRsvp: "GOING" | "INTERESTED" | "NOT_GOING" | null;
  rsvpCounts: {
    going: number;
    interested: number;
    notGoing: number;
  };
  isPast: boolean;
  isFull: boolean;
  attendeePreview: Array<{
    userId: string;
    name: string;
  }>;
}

export function EventsClient() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await apiFetch<{ items: EventItem[] }>("/events", {
        cache: "no-store",
      });
      setItems(response.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <ProtectedPage>
      <SiteShell>
        <section className="page-intro">
          <div>
            <p className="eyebrow">Events</p>
            <h2>Upcoming events from your university organizations</h2>
            <p className="muted">
              Track what is coming up, RSVP quickly, and get a clearer sense of campus momentum at a glance.
            </p>
          </div>
        </section>
        <section className="page-section">
          {loading ? (
            <div className="events-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="event-card-skeleton" key={index}>
                  <div className="event-skeleton-line event-skeleton-line-short" />
                  <div className="event-skeleton-line event-skeleton-line-title" />
                  <div className="event-skeleton-chip-row">
                    <div className="event-skeleton-chip" />
                    <div className="event-skeleton-chip event-skeleton-chip-short" />
                  </div>
                  <div className="event-skeleton-copy">
                    <div className="event-skeleton-line" />
                    <div className="event-skeleton-line" />
                    <div className="event-skeleton-line event-skeleton-line-short" />
                  </div>
                  <div className="event-skeleton-footer">
                    <div className="event-skeleton-button" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="events-grid">
              {items.map((event) => (
                <Card
                  bodyClassName="event-page-card-body"
                  className="event-page-card"
                  key={event.id}
                  eyebrow={event.organization.name}
                  title={event.title}
                  action={
                    <span className={event.isFull ? "access-pill access-pill-invite" : "access-pill access-pill-open"}>
                      {event.isPast ? "Past event" : event.isFull ? "Full" : "Upcoming"}
                    </span>
                  }
                >
                  <p className="card-description event-card-description">{event.description}</p>
                  <div className="event-meta-grid">
                    <span className="meta-chip">
                      <TimestampText value={event.startsAt} />
                    </span>
                    <span className="meta-chip meta-chip-soft">
                      {event.location ?? "Location TBA"}
                    </span>
                    {typeof event.capacity === "number" && (
                      <span className="meta-chip meta-chip-soft">Capacity {event.capacity}</span>
                    )}
                  </div>
                  <div className="event-card-footer">
                    <EventRsvpControls
                      currentUserRsvp={event.currentUserRsvp}
                      eventId={event.id}
                      initialCounts={event.rsvpCounts}
                      isFull={event.isFull}
                      isPast={event.isPast}
                      onUpdated={(payload) => {
                        setItems((currentItems) =>
                          currentItems.map((currentEvent) =>
                            currentEvent.id === event.id
                              ? {
                                  ...currentEvent,
                                  currentUserRsvp: payload.currentUserRsvp,
                                  rsvpCounts: payload.rsvpCounts,
                                  attendeePreview: payload.attendeePreview,
                                  isFull: payload.isFull,
                                }
                              : currentEvent,
                          ),
                        );
                      }}
                    />
                    {Boolean(event.attendeePreview.length) && (
                      <div className="attendee-preview-block">
                        <strong>Going</strong>
                        <div className="attendee-preview-row">
                          {event.attendeePreview.slice(0, 3).map((attendee) => (
                            <span className="meta-chip meta-chip-soft" key={attendee.userId}>
                              {attendee.name}
                            </span>
                          ))}
                          {event.attendeePreview.length > 3 && (
                            <span className="meta-chip meta-chip-soft">
                              +{event.attendeePreview.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </SiteShell>
    </ProtectedPage>
  );
}
