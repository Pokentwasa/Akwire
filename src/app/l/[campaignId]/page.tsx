import { notFound } from "next/navigation";
import { getCampaignForPublicForm } from "@/domain/leads/queries";
import { LeadForm } from "@/app/l/[campaignId]/lead-form";

export default async function PublicLeadPage({ params }: PageProps<"/l/[campaignId]">) {
  const { campaignId } = await params;
  const campaign = await getCampaignForPublicForm(campaignId);
  if (!campaign) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          {campaign.offer}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{campaign.angle}</h1>
      </div>
      <div className="rounded-lg border border-border bg-surface-raised p-6">
        <LeadForm campaignId={campaign.id} />
      </div>
    </main>
  );
}
