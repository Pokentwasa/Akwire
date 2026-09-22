import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { listCompanies } from "@/domain/companies/queries";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";
import { CampaignForm } from "@/app/(app)/campaigns/new/campaign-form";

export default async function NewCampaignPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const companies = await listCompanies(organisation.id);
  const eligible = companies.filter((c) => c.status !== "rejected");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Build a campaign</h1>
        <p className="text-ink-muted">
          Yebo generates the angle, offer, ad copy and lead-form copy — you take it from there.
        </p>
      </div>
      <CampaignForm companies={eligible} pack={webDesignLocalBusinessPack} />
    </main>
  );
}
