import Link from "next/link";
import { scoreOpportunity } from "@/domain/opportunities/engine";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";
import { seedCompanies } from "@/lib/demo/seed-companies";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ScoreDial } from "@/components/opportunity/score-dial";

function scoreColor(score: number) {
  if (score >= 70) return "text-success";
  if (score >= 45) return "text-warning";
  return "text-ink-muted";
}

export default function DemoPage() {
  const scored = seedCompanies.map((company) => ({
    company,
    opportunity: scoreOpportunity(webDesignLocalBusinessPack, company.industry, company.evidence),
  }));

  const highOpportunity = scored.filter((s) => s.opportunity.opportunityScore >= 70);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="font-display text-lg font-semibold text-ink">Yebo</span>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Create an account</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <Card className="border-accent/40 bg-accent/5">
          <p className="text-sm text-ink">
            <strong>This is a live demo.</strong> These five companies are seed data, but every
            score below is computed by the real Opportunity Engine
            (<code className="text-xs">scoreOpportunity()</code>) from the{" "}
            <strong>{webDesignLocalBusinessPack.name}</strong> pack — nothing here is hard-coded.
            No account or database needed to see it run.
          </p>
        </Card>

        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Today</h1>
          <p className="text-ink-muted">
            {highOpportunity.length} of {scored.length} companies score 70 or above.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {scored.map(({ company, opportunity }) => (
            <Card key={company.name}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{company.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {[company.industry, company.city, company.country].filter(Boolean).join(" · ")}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p
                    className={`font-display text-3xl font-semibold ${scoreColor(opportunity.opportunityScore)}`}
                  >
                    {opportunity.opportunityScore}
                  </p>
                  <p className="text-xs capitalize text-ink-muted">
                    {opportunity.confidence} confidence
                  </p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ScoreDial label="ICP fit" value={opportunity.icpFit} />
                <ScoreDial label="Business quality" value={opportunity.businessQuality} />
                <ScoreDial label="Service gap" value={opportunity.serviceGap} />
                <ScoreDial label="Timing" value={opportunity.timingScore} />
              </div>

              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-ink">Why</p>
                <ul className="flex flex-col gap-1.5">
                  {opportunity.explanation.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink-muted">
                      <span aria-hidden className="text-accent">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <p className="text-sm text-ink-muted">
                  Recommended: <span className="text-ink">{opportunity.recommendedService}</span>
                </p>
                <p className="text-sm font-medium text-ink">{opportunity.recommendedAction}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <CardTitle>Want to score your own companies?</CardTitle>
          <CardDescription className="mt-1">
            Create an account to add real companies and build a pipeline. A live database isn&apos;t
            wired up yet on this deployment — see docs/SETUP.md — but the scoring engine you just
            saw run is the same code either way.
          </CardDescription>
          <Button asChild className="mt-4 self-start">
            <Link href="/signup">Create an account</Link>
          </Button>
        </Card>
      </main>
    </div>
  );
}
