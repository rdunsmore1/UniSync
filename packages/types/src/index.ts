export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export type OrganizationVisibilityStatus =
  | "UNLISTED"
  | "LISTED"
  | "AUTO_HIDDEN"
  | "SUSPENDED";

export type ReportStatus = "OPEN" | "DISMISSED" | "ACTIONED";

export interface UniversitySummary {
  id: string;
  name: string;
  slug: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  memberCount: number;
  visibilityStatus: OrganizationVisibilityStatus;
}

export interface TutorProfileSummary {
  id: string;
  displayName: string;
  headline: string;
  subjects: string[];
  hourlyRate: number | null;
}
