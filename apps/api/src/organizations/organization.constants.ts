export const ORGANIZATION_CATEGORIES = [
  "Academic",
  "Career",
  "Social",
  "Service",
  "Arts",
  "Culture",
  "Sports",
  "Technology",
] as const;

export const ORGANIZATION_ACCESS_MODES = ["OPEN", "INVITE_ONLY"] as const;

export function slugifyOrganizationName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
