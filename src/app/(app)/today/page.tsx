import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function TodayPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Today</h1>
        <p className="text-ink-muted">
          What {organisation.name} can do today that moves pipeline forward.
        </p>
      </div>
      <Card>
        <CardTitle>Nothing here yet</CardTitle>
        <CardDescription className="mt-1">
          Discovery, opportunity scoring and campaigns come next. Once companies
          are shortlisted and researched, this screen will surface the highest
          leverage actions for {organisation.name}.
        </CardDescription>
      </Card>
    </main>
  );
}
