import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { getCompanyWorkspace } from "@/domain/companies/queries";
import { rejectCompanyAction, shortlistCompanyAction } from "@/app/(app)/companies/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function ScoreDial({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-border bg-surface p-4">
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-center text-xs text-ink-muted">{label}</p>
    </div>
  );
}

export default async function CompanyWorkspacePage({
  params,
}: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const workspace = await getCompanyWorkspace(organisation.id, id);
  if (!workspace) notFound();

  const { company, evidence, opportunities } = workspace;
  const opportunity = opportunities[0];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <Link href="/companies" className="text-sm text-ink-muted hover:text-ink">
          ← Companies
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{company.name}</h1>
            <p className="text-ink-muted">
              {[company.industry, company.city, company.country].filter(Boolean).join(" · ") ||
                "No details yet"}
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-ink-muted">
            {company.status}
          </span>
        </div>
      </div>

      {opportunity ? (
        <>
          <Card>
            <div className="mb-4 flex items-baseline justify-between">
              <CardTitle>Opportunity: {opportunity.recommended_service}</CardTitle>
              <p className="text-xs capitalize text-ink-muted">
                {opportunity.confidence} confidence
              </p>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <ScoreDial label="Opportunity score" value={opportunity.opportunity_score} />
              <ScoreDial label="ICP fit" value={opportunity.icp_fit} />
              <ScoreDial label="Business quality" value={opportunity.business_quality} />
              <ScoreDial label="Service gap" value={opportunity.service_gap} />
              <ScoreDial label="Timing" value={opportunity.timing_score} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Why</p>
              <ul className="flex flex-col gap-1.5">
                {(opportunity.explanation as string[]).map((reason, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-muted">
                    <span aria-hidden className="text-accent">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <div className="flex gap-3">
            <form action={shortlistCompanyAction.bind(null, company.id)}>
              <Button type="submit" disabled={company.status === "shortlisted"}>
                {company.status === "shortlisted" ? "Shortlisted" : "Shortlist"}
              </Button>
            </form>
            <form action={rejectCompanyAction.bind(null, company.id)}>
              <Button
                type="submit"
                variant="secondary"
                disabled={company.status === "rejected"}
              >
                {company.status === "rejected" ? "Rejected" : "Reject"}
              </Button>
            </form>
          </div>
        </>
      ) : (
        <Card>
          <CardTitle>No opportunity scored yet</CardTitle>
          <CardDescription className="mt-1">This shouldn&apos;t happen for a company created through the app.</CardDescription>
        </Card>
      )}

      <Card>
        <CardTitle>Evidence</CardTitle>
        <CardDescription className="mb-4 mt-1">
          Everything collected about this company so far.
        </CardDescription>
        {evidence.length === 0 ? (
          <p className="text-sm text-ink-muted">No evidence recorded.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {evidence.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-muted">{row.type}</span>
                <span className="font-medium text-ink">
                  {String((row.value as { value: unknown }).value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
