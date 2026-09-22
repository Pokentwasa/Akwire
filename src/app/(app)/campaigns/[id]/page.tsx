import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { getCampaignWorkspace } from "@/domain/campaigns/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function AssetCard({ type, content }: { type: string; content: Record<string, unknown> }) {
  if (type === "ad_copy") {
    return (
      <Card>
        <CardTitle>Ad copy</CardTitle>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <p className="font-medium text-ink">{String(content.headline)}</p>
          <p className="text-ink-muted">{String(content.body)}</p>
          <p className="w-fit rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-ink">
            {String(content.cta)}
          </p>
        </div>
      </Card>
    );
  }

  if (type === "lead_form_copy") {
    const fields = (content.fields as { label: string; required: boolean }[]) ?? [];
    return (
      <Card>
        <CardTitle>{String(content.title)}</CardTitle>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-muted">
          {fields.map((f) => (
            <li key={f.label}>
              {f.label}
              {f.required ? " *" : ""}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-warning">{String(content.consentNote)}</p>
      </Card>
    );
  }

  if (type === "landing_page_copy") {
    return (
      <Card>
        <CardTitle>Landing page copy</CardTitle>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <p className="font-medium text-ink">{String(content.headline)}</p>
          <p className="text-ink-muted">{String(content.subheadline)}</p>
          <p className="text-ink-muted">{String(content.body)}</p>
        </div>
      </Card>
    );
  }

  if (type === "campaign_setup_notes") {
    const decisionMakers = (content.decisionMakers as string[]) ?? [];
    return (
      <Card>
        <CardTitle>Setup notes</CardTitle>
        <p className="mt-3 text-sm text-ink-muted">
          Decision-makers to target: {decisionMakers.join(", ")}
        </p>
        <p className="mt-2 text-sm text-ink-muted">{String(content.note)}</p>
      </Card>
    );
  }

  return null;
}

export default async function CampaignWorkspacePage({ params }: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const workspace = await getCampaignWorkspace(organisation.id, id);
  if (!workspace) notFound();

  const { campaign, companies, assets } = workspace;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <Link href="/campaigns" className="text-sm text-ink-muted hover:text-ink">
          ← Campaigns
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{campaign.name}</h1>
        <p className="text-ink-muted">
          {companies.length} companies · {campaign.route} route ·{" "}
          <span className="capitalize">{campaign.status}</span>
        </p>
      </div>

      <Card>
        <CardTitle>{campaign.angle}</CardTitle>
        <CardDescription className="mt-1">{campaign.offer}</CardDescription>
        <p className="mt-3 text-sm text-ink-muted">
          Public lead page:{" "}
          <Link href={`/l/${campaign.id}`} className="text-accent hover:underline">
            /l/{campaign.id}
          </Link>
        </p>
      </Card>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold text-ink">Campaign assets</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assets.map((asset) => (
            <AssetCard key={asset.id} type={asset.type} content={asset.content as Record<string, unknown>} />
          ))}
        </div>
      </div>

      <Card>
        <CardTitle>Target companies</CardTitle>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {companies.map((c, i) => {
            const company = c.companies as unknown as { id: string; name: string } | null;
            return (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/companies/${company?.id}`} className="text-ink hover:text-accent">
                  {company?.name}
                </Link>
                <span className="text-xs capitalize text-ink-muted">{c.status}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </main>
  );
}
