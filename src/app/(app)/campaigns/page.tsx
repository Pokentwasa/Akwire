import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function CampaignsPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Campaigns</h1>
      <Card>
        <CardTitle>Coming in a later phase</CardTitle>
        <CardDescription className="mt-1">
          This section is scaffolded but not built yet. See docs/PLAN.md for the phase it belongs to.
        </CardDescription>
      </Card>
    </main>
  );
}
