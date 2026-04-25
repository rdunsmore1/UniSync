import { OrganizationDetailClient } from "../../../components/organization-detail-client";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrganizationDetailClient slug={slug} />;
}
