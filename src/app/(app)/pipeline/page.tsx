import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { listLeads } from "@/domain/leads/queries";
import { Card } from "@/components/ui/card";

const COLUMNS: { status: string; label: string }[] = [
  { status: "new", label: "New" },
  { status: "qualified", label: "Qualified" },
  { status: "pitch_ready", label: "Pitch ready" },
  { status: "pitch_sent", label: "Pitch sent" },
  { status: "replied", label: "Replied" },
  { status: "meeting", label: "Meeting" },
  { status: "proposal", label: "Proposal" },
  { status: "negotiation", label: "Negotiation" },
  { status: "won", label: "Won" },
  { status: "lost", label: "Lost" },
];

export default async function PipelinePage() {
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const leads = await listLeads(organisation.id);
  const byStatus = new Map<string, typeof leads>();
  for (const lead of leads) {
    const list = byStatus.get(lead.status) ?? [];
    list.push(lead);
    byStatus.set(lead.status, list);
  }

  const activeColumns = COLUMNS.filter((c) => (byStatus.get(c.status)?.length ?? 0) > 0);

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Pipeline</h1>
        <p className="text-ink-muted">{leads.length} leads across {organisation.name}&apos;s funnel.</p>
      </div>

      {activeColumns.length === 0 ? (
        <Card className="max-w-md">
          <p className="text-sm text-ink-muted">
            No leads yet. They&apos;ll show up here once someone submits a campaign form or you add
            one manually.
          </p>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {activeColumns.map((column) => (
            <div key={column.status} className="w-64 flex-shrink-0">
              <p className="mb-2 text-sm font-medium text-ink">
                {column.label}{" "}
                <span className="text-ink-muted">({byStatus.get(column.status)?.length})</span>
              </p>
              <div className="flex flex-col gap-2">
                {byStatus.get(column.status)?.map((lead) => {
                  const company = lead.companies as unknown as { name: string } | null;
                  const name =
                    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed";
                  return (
                    <Link key={lead.id} href={`/leads/${lead.id}`}>
                      <Card className="p-3 transition-colors hover:border-accent">
                        <p className="text-sm font-medium text-ink">{name}</p>
                        {company ? <p className="text-xs text-ink-muted">{company.name}</p> : null}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
