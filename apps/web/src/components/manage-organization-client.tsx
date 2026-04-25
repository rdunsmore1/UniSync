"use client";

import { useEffect, useState } from "react";
import { Card } from "@unisync/ui";
import { apiFetch, patchJson, postJson } from "../lib/api";
import { EventRsvpControls } from "./event-rsvp-controls";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";
import { TimestampText } from "./timestamp-text";

interface ManageOrganizationData {
  id: string;
  name: string;
  category: string;
  accessMode: "OPEN" | "INVITE_ONLY";
  tags: string[];
  currentUserRole: "OWNER" | "ADMIN" | "VIEWER" | "MEMBER" | null;
  unsectionedRooms: Array<{
    id: string;
    name: string;
    topic: string | null;
  }>;
  sections: Array<{
    id: string;
    name: string;
    rooms: Array<{
      id: string;
      name: string;
      topic: string | null;
    }>;
  }>;
  members: Array<{
    userId: string;
    role: "OWNER" | "ADMIN" | "VIEWER" | "MEMBER";
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
  listingRules: {
    minimumMembers: number;
    becomesListedAfterFirstEvent: boolean;
    autoHideAfterReports: number;
    categoryOptions: string[];
    accessModeOptions: Array<"OPEN" | "INVITE_ONLY">;
  };
}

export function ManageOrganizationClient({ slug }: { slug: string }) {
  const [data, setData] = useState<ManageOrganizationData | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tagDrafts, setTagDrafts] = useState<string[]>([]);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagStatus, setTagStatus] = useState<string | null>(null);
  const canManage = data?.currentUserRole === "OWNER" || data?.currentUserRole === "ADMIN";
  const canChangeRoles = data?.currentUserRole === "OWNER";
  const totalRoomCount =
    (data?.unsectionedRooms.length ?? 0) +
    (data?.sections.reduce((total, section) => total + section.rooms.length, 0) ?? 0);
  const totalMembers = data?.members.length ?? 0;
  const upcomingEventCount = data?.upcomingEvents.length ?? 0;

  async function load() {
    const response = await apiFetch<ManageOrganizationData>(`/organizations/${slug}`, {
      cache: "no-store",
    });
    setData(response);
    setTagDrafts(response.tags ?? []);
  }

  useEffect(() => {
    void load();
  }, [slug]);

  async function handleCreateRoom(formData: FormData) {
    if (!data) {
      return;
    }

    await postJson(`/organizations/${data.id}/rooms`, {
      name: formData.get("name"),
      slug: formData.get("slug"),
      parentRoomId: null,
      sectionId: null,
    });
    await load();
  }

  async function handleCreateEvent(formData: FormData) {
    if (!data) {
      return;
    }

    await postJson(`/organizations/${data.id}/events`, {
      title: formData.get("title"),
      description: formData.get("description"),
      startsAt: formData.get("startsAt"),
      location: formData.get("location"),
    });
    await load();
  }

  async function handlePromote(userId: string) {
    if (!data) {
      return;
    }

    await patchJson(`/organizations/${data.id}/members/${userId}/role`, {
      role: "ADMIN",
    });
    await load();
  }

  async function saveTags(nextTags: string[]) {
    if (!data) {
      return;
    }

    await patchJson(`/organizations/${data.id}/tags`, { tags: nextTags });
  }

  async function handleAddTag() {
    if (!data) {
      return;
    }

    const normalizedTag = tagInput.trim().toLowerCase().replace(/^#+/, "");

    if (!normalizedTag) {
      setTagError("Enter a tag before creating it.");
      return;
    }

    if (tagDrafts.includes(normalizedTag)) {
      setTagError("That tag already exists.");
      setTagInput("");
      return;
    }

    const nextTags = [...tagDrafts, normalizedTag];
    setTagDrafts(nextTags);
    setTagInput("");
    setTagError(null);
    setTagStatus("Tag created");

    try {
      await saveTags(nextTags);
      await load();
    } catch (requestError) {
      setTagDrafts(tagDrafts);
      setTagError(
        requestError instanceof Error ? requestError.message : "Unable to create tag.",
      );
      setTagStatus(null);
    }
  }

  async function handleRemoveTag(tagToRemove: string) {
    if (!data) {
      return;
    }

    const nextTags = tagDrafts.filter((tag) => tag !== tagToRemove);
    setTagDrafts(nextTags);
    setTagError(null);
    setTagStatus("Tag removed");

    try {
      await saveTags(nextTags);
      await load();
    } catch (requestError) {
      setTagDrafts(tagDrafts);
      setTagError(
        requestError instanceof Error ? requestError.message : "Unable to remove tag.",
      );
      setTagStatus(null);
    }
  }

  return (
    <ProtectedPage>
      <SiteShell>
        <section className="page-intro">
          <div>
            <p className="eyebrow">Organization admin</p>
            <h2>{data?.name ?? "Loading organization..."}</h2>
            <p className="muted">
              Manage discovery, rooms, events, and member permissions from one place without leaving the organization.
            </p>
            <div className="meta-chip-row">
              <span className="meta-chip meta-chip-soft">Role-gated by backend permissions</span>
              {data?.accessMode && (
                <span
                  className={
                    data.accessMode === "OPEN"
                      ? "access-pill access-pill-open"
                      : "access-pill access-pill-invite"
                  }
                >
                  {data.accessMode === "OPEN" ? "Open to anyone" : "Invite only"}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="admin-overview-band">
            <div className="admin-overview-copy">
              <p className="eyebrow">Command center</p>
              <h3>Keep structure and activity clear as your organization grows</h3>
              <p className="muted">
                The most important controls live up front so you can shape discovery, guide members, and monitor engagement without digging through clutter.
              </p>
            </div>
            <div className="admin-overview-stats">
              <div className="admin-overview-stat">
                <strong>{totalRoomCount}</strong>
                <span>rooms</span>
              </div>
              <div className="admin-overview-stat">
                <strong>{upcomingEventCount}</strong>
                <span>upcoming events</span>
              </div>
              <div className="admin-overview-stat">
                <strong>{totalMembers}</strong>
                <span>members</span>
              </div>
            </div>
          </div>
        </section>

        <div className="admin-dashboard-grid">
          <div className="admin-dashboard-primary">
            <div className="admin-utility-grid">
              <Card className="admin-panel-card admin-panel-card-compact" title="Create room" eyebrow="Admin action">
                <p className="admin-card-helper">
                  Spin up new spaces quickly when the organization needs a clearer flow.
                </p>
                {canManage ? (
                  <form
                    action={async (formData) => {
                      await handleCreateRoom(formData);
                    }}
                    className="form-grid"
                  >
                    <label>
                      Room name
                      <input name="name" required type="text" />
                    </label>
                    <label>
                      Room slug
                      <input name="slug" required type="text" />
                    </label>
                    <button className="ui-button ui-button-primary" type="submit">
                      Create room
                    </button>
                  </form>
                ) : (
                  <p className="muted">Room management is available to owners and admins only.</p>
                )}
              </Card>

              <Card className="admin-panel-card admin-panel-card-compact" title="Create event" eyebrow="Admin action">
                <p className="admin-card-helper">
                  Publish the next opportunity for members to show up and participate.
                </p>
                {canManage ? (
                  <form
                    action={async (formData) => {
                      await handleCreateEvent(formData);
                    }}
                    className="form-grid"
                  >
                    <label>
                      Title
                      <input name="title" required type="text" />
                    </label>
                    <label>
                      Description
                      <input name="description" required type="text" />
                    </label>
                    <label>
                      Start time
                      <input name="startsAt" required type="datetime-local" />
                    </label>
                    <label>
                      Location
                      <input name="location" type="text" />
                    </label>
                    <button className="ui-button ui-button-primary" type="submit">
                      Publish event
                    </button>
                  </form>
                ) : (
                  <p className="muted">Event publishing is available to owners and admins only.</p>
                )}
              </Card>
            </div>

            <Card
              bodyClassName="admin-panel-scroll"
              className="admin-panel-card admin-panel-card-featured"
              title="Current rooms"
              eyebrow="Live structure"
            >
              <p className="admin-card-helper">
                This is the member-facing structure students move through every day.
              </p>
              <div className="list-grid">
                {data?.unsectionedRooms.map((room) => (
                  <a
                    className="room-link-card"
                    href={`/organizations/${slug}/rooms/${room.id}`}
                    key={room.id}
                  >
                    <strong>{room.name}</strong>
                    <span>{room.topic ?? "No topic yet"}</span>
                  </a>
                ))}
                {data?.sections.flatMap((section) =>
                  section.rooms.map((room) => (
                    <a
                      className="room-link-card"
                      href={`/organizations/${slug}/rooms/${room.id}`}
                      key={room.id}
                    >
                      <strong>{section.name} / {room.name}</strong>
                      <span>{room.topic ?? "No topic yet"}</span>
                    </a>
                  )),
                )}
              </div>
            </Card>

            <Card
              bodyClassName="admin-panel-scroll"
              className="admin-panel-card admin-panel-card-featured"
              title="Event RSVP activity"
              eyebrow="Organizer view"
            >
              <p className="admin-card-helper">
                Watch momentum build around upcoming events without leaving the admin surface.
              </p>
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
                      <div className="rsvp-counts">
                        <span>{event.rsvpCounts.going} going</span>
                        <span>{event.rsvpCounts.interested} interested</span>
                        <span>{event.rsvpCounts.notGoing} not going</span>
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
                      {Boolean(event.attendeePreview.length) && (
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
                  <p className="muted">No upcoming events yet.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="admin-dashboard-secondary">
            <Card
              bodyClassName="admin-panel-scroll"
              className="admin-panel-card"
              title="Discovery tags"
              eyebrow="Post-creation search help"
            >
              <p className="admin-card-helper">
                Fine-tune how students discover the organization through search and category browsing.
              </p>
              {canManage ? (
                <div className="form-grid">
                  <label>
                    Create tag
                    <div className="tag-creator-row">
                      <input
                        name="tag"
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleAddTag();
                          }
                        }}
                        placeholder="law, networking, debate"
                        type="text"
                        value={tagInput}
                      />
                      <button
                        className="ui-button ui-button-primary"
                        onClick={() => void handleAddTag()}
                        type="button"
                      >
                        Create tag
                      </button>
                    </div>
                  </label>
                  <div className="tag-session-list">
                    {tagDrafts.length ? (
                      tagDrafts.map((tag) => (
                        <button
                          className="tag-editor-chip"
                          key={tag}
                          onClick={() => void handleRemoveTag(tag)}
                          type="button"
                        >
                          #{tag}
                          <span className="tag-editor-chip-remove">Remove</span>
                        </button>
                      ))
                    ) : (
                      <span className="muted">No tags created yet in this session</span>
                    )}
                  </div>
                  <p className="muted">
                    Create tags one at a time. They appear here immediately so you can build a searchable list quickly.
                  </p>
                  {tagStatus && <p className="tag-status">{tagStatus}</p>}
                  {tagError && <p className="form-error">{tagError}</p>}
                </div>
              ) : (
                <p className="muted">Only owners and admins can edit tags.</p>
              )}
            </Card>

            <Card
              bodyClassName="admin-panel-scroll"
              className="admin-panel-card"
              title="Visibility rules"
              eyebrow="Discovery"
            >
              <p className="admin-card-helper">
                These rules shape when the organization becomes easier to discover across campus.
              </p>
              <div className="list-grid">
                <span>Unlisted by default</span>
                <span>Category: {data?.category ?? "Not set"}</span>
                <span>
                  Access:{" "}
                  {data?.accessMode === "OPEN"
                    ? "Open to anyone"
                    : "Invite only with viewer preview"}
                </span>
                <span>
                  Listed after {data?.listingRules.minimumMembers ?? 0} members or one event
                </span>
                <span>Auto-hidden after {data?.listingRules.autoHideAfterReports ?? 0} reports</span>
              </div>
            </Card>

            <Card
              bodyClassName="admin-panel-scroll"
              className="admin-panel-card"
              title="Members"
              eyebrow="Owner controls"
            >
              <p className="admin-card-helper">
                Promote leaders and keep role visibility understandable for the whole team.
              </p>
              <div className="member-list">
                {data?.members.map((member) => (
                  <div className="member-row" key={member.userId}>
                    <span>{member.name}</span>
                    <div className="inline-meta">
                      <span className="meta-chip meta-chip-soft">{member.role}</span>
                      {canChangeRoles && ["MEMBER", "VIEWER"].includes(member.role) && (
                        <button
                          className="ui-button ui-button-ghost"
                          onClick={() => void handlePromote(member.userId)}
                          type="button"
                        >
                          Promote to admin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </SiteShell>
    </ProtectedPage>
  );
}
