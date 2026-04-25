"use client";

import Link from "next/link";

export function AddOrganizationCard() {
  return (
    <Link
      aria-label="Join or create organization"
      className="ui-card ui-hover-accent add-organization-card"
      href="/organizations"
    >
      <div className="add-organization-card-content">
        <span aria-hidden="true" className="add-organization-card-icon">
          +
        </span>
        <div className="add-organization-card-copy">
          <strong>Join or Create Organization</strong>
          <span>Browse campus groups or start one of your own</span>
        </div>
      </div>
    </Link>
  );
}
