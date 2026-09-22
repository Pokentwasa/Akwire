import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { listCompanies } from "@/domain/companies/queries";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { scoreColor } from "@/components/opportunity/score-color";

export default async function CompaniesPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const companies = await listCompanies(organisation.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Companies</h1>
          <p className="text-ink-muted">Every company Yebo has scored for {organisation.name}.</p>
        </div>
        <Button asChild>
          <Link href="/companies/new">Add company</Link>
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardTitle>No companies yet</CardTitle>
          <CardDescription className="mt-1">
            Add one manually to see the Opportunity Engine score it. Automated discovery
            (Google Places) lands in Phase 2.
          </CardDescription>
          <Button asChild className="mt-4 self-start">
            <Link href="/companies/new">Add your first company</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((company) => {
            const opportunity = company.opportunities?.[0];
            return (
              <Link key={company.id} href={`/companies/${company.id}`}>
                <Card className="flex flex-row items-center justify-between gap-4 transition-colors hover:border-accent">
                  <div>
                    <p className="font-medium text-ink">{company.name}</p>
                    <p className="text-sm text-ink-muted">
                      {[company.industry, company.city].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    {opportunity ? (
                      <div className="text-right">
                        <p className={`font-display text-xl font-semibold ${scoreColor(opportunity.opportunity_score, opportunity.confidence)}`}>
                          {opportunity.opportunity_score}
                        </p>
                        <p className="text-xs capitalize text-ink-muted">
                          {opportunity.confidence} confidence
                        </p>
                      </div>
                    ) : null}
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-ink-muted">
                      {company.status}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
