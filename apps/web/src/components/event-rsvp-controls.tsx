"use client";

import { useState, useTransition } from "react";
import { postJson } from "../lib/api";

type RsvpStatus = "GOING" | "INTERESTED" | "NOT_GOING";

interface EventRsvpControlsProps {
  eventId: string;
  currentUserRsvp: RsvpStatus | null;
  initialCounts: {
    going: number;
    interested: number;
    notGoing: number;
  };
  isPast: boolean;
  isFull: boolean;
  onUpdated?: (payload: {
    currentUserRsvp: RsvpStatus;
    rsvpCounts: {
      going: number;
      interested: number;
      notGoing: number;
    };
    attendeePreview: Array<{
      userId: string;
      name: string;
    }>;
    confirmationMessage: string;
    isFull: boolean;
  }) => void;
  compact?: boolean;
}

const buttonCopy: Record<RsvpStatus, string> = {
  GOING: "Going",
  INTERESTED: "Interested",
  NOT_GOING: "Not going",
};

function getCountKey(status: RsvpStatus) {
  if (status === "GOING") {
    return "going" as const;
  }

  if (status === "INTERESTED") {
    return "interested" as const;
  }

  return "notGoing" as const;
}

export function EventRsvpControls({
  eventId,
  currentUserRsvp,
  initialCounts,
  isPast,
  isFull,
  onUpdated,
  compact = false,
}: EventRsvpControlsProps) {
  const [selectedStatus, setSelectedStatus] = useState<RsvpStatus | null>(
    currentUserRsvp,
  );
  const [counts, setCounts] = useState(initialCounts);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function getOptimisticCounts(nextStatus: RsvpStatus) {
    const optimistic = { ...counts };

    if (selectedStatus) {
      optimistic[getCountKey(selectedStatus)] -= 1;
    }

    optimistic[getCountKey(nextStatus)] += 1;
    return optimistic;
  }

  function handleRsvp(nextStatus: RsvpStatus) {
    if (isPast || pending || (isFull && nextStatus === "GOING" && selectedStatus !== "GOING")) {
      return;
    }

    const previousStatus = selectedStatus;
    const previousCounts = counts;
    const optimisticCounts = getOptimisticCounts(nextStatus);

    setSelectedStatus(nextStatus);
    setCounts(optimisticCounts);
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await postJson<{
          currentUserRsvp: RsvpStatus;
          rsvpCounts: {
            going: number;
            interested: number;
            notGoing: number;
          };
          attendeePreview: Array<{
            userId: string;
            name: string;
          }>;
          confirmationMessage: string;
          isFull: boolean;
        }>(`/events/${eventId}/rsvp`, {
          status: nextStatus,
        });

        setSelectedStatus(response.currentUserRsvp);
        setCounts(response.rsvpCounts);
        setMessage(response.confirmationMessage);
        onUpdated?.(response);
      } catch (requestError) {
        setSelectedStatus(previousStatus);
        setCounts(previousCounts);
        setError(
          requestError instanceof Error ? requestError.message : "Unable to update RSVP.",
        );
      }
    });
  }

  return (
    <div className={compact ? "rsvp-panel rsvp-panel-compact" : "rsvp-panel"}>
      <div className="rsvp-button-row">
        {(["GOING", "INTERESTED", "NOT_GOING"] as const).map((status) => {
          const isActive = selectedStatus === status;
          const isDisabled =
            pending ||
            isPast ||
            (isFull && status === "GOING" && selectedStatus !== "GOING");

          return (
            <button
              className={isActive ? "rsvp-button rsvp-button-active" : "rsvp-button"}
              disabled={isDisabled}
              key={status}
              onClick={() => handleRsvp(status)}
              type="button"
            >
              {buttonCopy[status]}
            </button>
          );
        })}
      </div>
      <div className="rsvp-counts">
        <span>{counts.going} going</span>
        <span>{counts.interested} interested</span>
        <span>{counts.notGoing} not going</span>
      </div>
      {!compact && message && <p className="rsvp-message">{message}</p>}
      {!compact && error && <p className="form-error">{error}</p>}
      {!compact && isPast && <p className="muted">This event has already started.</p>}
      {!compact && isFull && selectedStatus !== "GOING" && (
        <p className="muted">This event is currently full for new attendees.</p>
      )}
    </div>
  );
}
