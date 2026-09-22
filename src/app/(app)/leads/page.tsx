import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { listLeads } from "@/domain/leads/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function LeadsPage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const leads = await listLeads(organisation.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Leads</h1>
        <p className="text-ink-muted">People who&apos;ve raised their hand for {organisation.name}.</p>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardTitle>No leads yet</CardTitle>
          <CardDescription className="mt-1">
            Leads appear here when someone submits a campaign&apos;s lead form, or you add one
            manually.
          </CardDescription>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => {
            const campaign = lead.campaigns as unknown as { name: string } | null;
            const company = lead.companies as unknown as { name: string } | null;
            const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed";
            return (
              <Link key={lead.id} href={`/leads/${lead.id}`}>
                <Card className="flex items-center justify-between transition-colors hover:border-accent">
                  <div>
                    <p className="font-medium text-ink">{name}</p>
                    <p className="text-sm text-ink-muted">
                      {lead.email ?? "No email"}
                      {company ? ` · ${company.name}` : ""}
                      {campaign ? ` · via ${campaign.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase text-ink-muted">{lead.source}</span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-ink-muted">
                      {lead.status.replace(/_/g, " ")}
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
