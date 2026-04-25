"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@unisync/ui";
import { postJson } from "../lib/api";
import { ProtectedPage } from "./protected-page";
import { SiteShell } from "./site-shell";

const categoryOptions = [
  "Academic",
  "Career",
  "Social",
  "Service",
  "Arts",
  "Culture",
  "Sports",
  "Technology",
];

interface CreateOrganizationResponse {
  item: {
    slug: string;
  };
}

export function OrganizationCreateClient() {
  const router = useRouter();
  const [createError, setCreateError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    setCreateError(null);

    try {
      const response = await postJson<CreateOrganizationResponse>("/organizations", {
        name: formData.get("name"),
        description: formData.get("description"),
        category: formData.get("category"),
        accessMode: formData.get("accessMode"),
      });

      router.push(`/organizations/${response.item.slug}/manage`);
      router.refresh();
    } catch (createRequestError) {
      setCreateError(
        createRequestError instanceof Error
          ? createRequestError.message
          : "Unable to create organization.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <ProtectedPage>
      <SiteShell>
        <section className="page-intro">
          <div>
            <p className="eyebrow">Create organization</p>
            <h2>Start a new campus organization</h2>
            <p className="muted">
              Keep setup simple now. You can refine tags, rooms, and discovery settings after the organization is live.
            </p>
          </div>
        </section>

        <section className="page-section">
          <Card title="Organization setup" eyebrow="Owner flow">
            <form
              action={async (formData) => {
                await handleCreate(formData);
              }}
              className="form-grid"
            >
              <label>
                Name
                <input name="name" placeholder="Pre-Law Society" required type="text" />
              </label>
              <label>
                Category
                <select name="category" required>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Access
                <select name="accessMode" required>
                  <option value="OPEN">Open to anyone</option>
                  <option value="INVITE_ONLY">Invite only</option>
                </select>
              </label>
                <label>
                  Description
                  <input
                    name="description"
                    placeholder="Tell students what your organization is about and who it is for"
                    required
                    type="text"
                  />
                </label>
                <p className="muted">
                  The organization URL slug will be generated automatically from the name.
                </p>
              {createError && <p className="form-error">{createError}</p>}
              <button className="ui-button ui-button-primary" disabled={pending} type="submit">
                {pending ? "Creating..." : "Create organization"}
              </button>
            </form>
          </Card>
        </section>
      </SiteShell>
    </ProtectedPage>
  );
}
