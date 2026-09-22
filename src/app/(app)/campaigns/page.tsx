import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { listCampaigns } from "@/domain/campaigns/queries";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function CampaignsPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const campaigns = await listCampaigns(organisation.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Campaigns</h1>
          <p className="text-ink-muted">Acquisition campaigns for {organisation.name}.</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">New campaign</Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardTitle>No campaigns yet</CardTitle>
          <CardDescription className="mt-1">
            Shortlist some companies first, then build a campaign around them.
          </CardDescription>
          <Button asChild className="mt-4 self-start">
            <Link href="/campaigns/new">Build a campaign</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-accent">
                <div>
                  <p className="font-medium text-ink">{campaign.name}</p>
                  <p className="text-sm text-ink-muted">{campaign.angle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-ink-muted">
                    {campaign.campaign_companies?.[0]?.count ?? 0} companies
                  </p>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-ink-muted">
                    {campaign.status}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
