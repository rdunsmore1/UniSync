import { ManageOrganizationClient } from "../../../../components/manage-organization-client";

export default async function ManageOrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ManageOrganizationClient slug={slug} />;
}
