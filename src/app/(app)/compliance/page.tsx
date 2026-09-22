import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { listConsentRequests, listSuppression } from "@/domain/compliance/queries";
import { withdrawConsentAction } from "@/app/(app)/compliance/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";

export default async function CompliancePage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const [consentRequests, suppressed] = await Promise.all([
    listConsentRequests(organisation.id),
    listSuppression(organisation.id),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Compliance</h1>
        <p className="text-ink-muted">
          Consent and suppression records for {organisation.name}. Technical enforcement only —
          the wording used has not been reviewed by legal counsel (see docs/LEGAL_REVIEW.md).
        </p>
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold text-ink">Consent requests</h2>
        {consentRequests.length === 0 ? (
          <Card>
            <CardDescription>
              None yet. Request consent from a company&apos;s workspace before pitching via direct
              outreach (section 17/18).
            </CardDescription>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {consentRequests.map((cr) => {
              const company = cr.companies as unknown as { name: string } | null;
              return (
                <Card key={cr.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{company?.name ?? "Unknown company"}</p>
                    <p className="text-sm text-ink-muted">
                      {cr.channel} · requested {new Date(cr.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-ink-muted">
                      {cr.status}
                    </span>
                    {cr.status !== "withdrawn" ? (
                      <form action={withdrawConsentAction.bind(null, cr.id)}>
                        <Button type="submit" size="sm" variant="secondary">
                          Withdraw
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold text-ink">Suppression list</h2>
        {suppressed.length === 0 ? (
          <Card>
            <CardDescription>No suppressed companies.</CardDescription>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {suppressed.map((s) => {
              const company = s.companies as unknown as { name: string } | null;
              return (
                <Card key={s.id} className="flex items-center justify-between">
                  <p className="font-medium text-ink">{company?.name ?? "Unknown company"}</p>
                  <p className="text-sm text-ink-muted">{s.reason}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
