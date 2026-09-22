import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { listCompanies } from "@/domain/companies/queries";
import { listLeads } from "@/domain/leads/queries";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function TodayPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const [companies, leads] = await Promise.all([
    listCompanies(organisation.id),
    listLeads(organisation.id),
  ]);
  const needsReview = companies.filter((c) => c.status === "new");
  const highOpportunity = companies.filter(
    (c) => (c.opportunities?.[0]?.opportunity_score ?? 0) >= 70 && c.status !== "rejected",
  );
  const shortlisted = companies.filter((c) => c.status === "shortlisted");
  const newLeads = leads.filter((l) => l.status === "new");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Today</h1>
        <p className="text-ink-muted">
          What {organisation.name} can do today that moves pipeline forward.
        </p>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardTitle>Nothing scored yet</CardTitle>
          <CardDescription className="mt-1">
            Add your first company and Yebo will score the opportunity — this screen fills in
            once there&apos;s something to act on.
          </CardDescription>
          <Button asChild className="mt-4 self-start">
            <Link href="/companies/new">Add a company</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {needsReview.length > 0 ? (
            <Card className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {needsReview.length} compan{needsReview.length === 1 ? "y needs" : "ies need"}{" "}
                  review
                </CardTitle>
                <CardDescription className="mt-1">
                  Scored but not yet shortlisted or rejected.
                </CardDescription>
              </div>
              <Button asChild variant="secondary">
                <Link href="/companies">Review</Link>
              </Button>
            </Card>
          ) : null}

          {highOpportunity.length > 0 ? (
            <Card className="flex items-center justify-between">
              <div>
                <CardTitle>{highOpportunity.length} high-opportunity companies</CardTitle>
                <CardDescription className="mt-1">
                  Scoring 70 or above — worth shortlisting if you haven&apos;t already.
                </CardDescription>
              </div>
              <Button asChild variant="secondary">
                <Link href="/companies">Review</Link>
              </Button>
            </Card>
          ) : null}

          {shortlisted.length > 0 ? (
            <Card className="flex items-center justify-between">
              <div>
                <CardTitle>{shortlisted.length} shortlisted</CardTitle>
                <CardDescription className="mt-1">Ready to build a campaign around.</CardDescription>
              </div>
              <Button asChild variant="secondary">
                <Link href="/campaigns/new">Build campaign</Link>
              </Button>
            </Card>
          ) : null}

          {newLeads.length > 0 ? (
            <Card className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {newLeads.length} new lead{newLeads.length === 1 ? "" : "s"}
                </CardTitle>
                <CardDescription className="mt-1">Captured and waiting on you.</CardDescription>
              </div>
              <Button asChild variant="secondary">
                <Link href="/leads">Review</Link>
              </Button>
            </Card>
          ) : null}

          {needsReview.length === 0 &&
          highOpportunity.length === 0 &&
          shortlisted.length === 0 &&
          newLeads.length === 0 ? (
            <Card>
              <CardTitle>All caught up</CardTitle>
              <CardDescription className="mt-1">
                Every company has been reviewed. Add more to keep the pipeline moving.
              </CardDescription>
              <Button asChild className="mt-4 self-start">
                <Link href="/companies/new">Add a company</Link>
              </Button>
            </Card>
          ) : null}
        </div>
      )}
    </main>
  );
}
