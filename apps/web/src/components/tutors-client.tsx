"use client";

import { useEffect, useState } from "react";
import { Card } from "@unisync/ui";
import { apiFetch, postJson } from "../lib/api";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";

interface TutorItem {
  id: string;
  displayName: string;
  headline: string;
  description: string;
  subjects: string[];
  hourlyRate: number | null;
}

export function TutorsClient() {
  const [items, setItems] = useState<TutorItem[]>([]);

  useEffect(() => {
    apiFetch<{ items: TutorItem[] }>("/tutors", {
      cache: "no-store",
    }).then((response) => setItems(response.items));
  }, []);

  async function handleContact(tutorId: string) {
    await postJson(`/tutors/${tutorId}/contact`, {});
  }

  return (
    <ProtectedPage>
      <SiteShell>
        <section className="page-intro">
          <div>
            <p className="eyebrow">Tutors</p>
            <h2>Verified student tutors on your campus</h2>
            <p className="muted">
              Find subject support from students who already understand your campus and course expectations.
            </p>
          </div>
        </section>
        <div className="card-grid">
          {items.map((tutor) => (
            <Card key={tutor.id} title={tutor.displayName} eyebrow="Tutor">
              <p className="card-description">{tutor.headline}</p>
              <p>{tutor.description}</p>
              <div className="tag-row">
                {tutor.subjects.map((subject) => (
                  <span className="meta-chip meta-chip-soft" key={subject}>
                    {subject}
                  </span>
                ))}
              </div>
              <div className="inline-meta inline-meta-spread">
                <span className="meta-chip">
                  {tutor.hourlyRate ? `$${tutor.hourlyRate}/hr` : "Rate on request"}
                </span>
                <button
                  className="ui-button ui-button-ghost"
                  onClick={() => void handleContact(tutor.id)}
                  type="button"
                >
                  Message tutor
                </button>
              </div>
            </Card>
          ))}
        </div>
      </SiteShell>
    </ProtectedPage>
  );
}
