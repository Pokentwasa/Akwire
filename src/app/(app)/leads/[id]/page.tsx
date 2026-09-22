import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { getLeadWorkspace } from "@/domain/leads/queries";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { GeneratePitchButton, MarkPitchSentButton, StageActionsPanel } from "@/app/(app)/leads/[id]/stage-actions";

export default async function LeadWorkspacePage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const organisation = await getCurrentOrganisation();
  if (!organisation) redirect("/onboarding");

  const workspace = await getLeadWorkspace(organisation.id, id);
  if (!workspace) notFound();

  const { lead, pitches, followups, meetings } = workspace;
  const company = lead.companies as unknown as { id: string; name: string } | null;
  const campaign = lead.campaigns as unknown as { name: string } | null;
  const latestPitch = pitches[0];
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed lead";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <Link href="/leads" className="text-sm text-ink-muted hover:text-ink">
          ← Leads
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{name}</h1>
            <p className="text-ink-muted">
              {lead.email ?? "No email"}
              {company ? (
                <>
                  {" · "}
                  <Link href={`/companies/${company.id}`} className="hover:text-accent">
                    {company.name}
                  </Link>
                </>
              ) : null}
              {campaign ? ` · via ${campaign.name}` : ""}
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs capitalize text-ink-muted">
            {lead.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <Card>
        <CardTitle>Pitch</CardTitle>
        {latestPitch ? (
          <div className="mt-3 flex flex-col gap-3">
            <div className="rounded-md border border-border bg-surface p-4 text-sm">
              <p className="font-medium text-ink">{latestPitch.subject}</p>
              <pre className="mt-2 whitespace-pre-wrap font-body text-ink-muted">{latestPitch.body}</pre>
            </div>
            {latestPitch.status === "draft" ? (
              <MarkPitchSentButton leadId={lead.id} pitchId={latestPitch.id} />
            ) : (
              <p className="text-sm text-success">Sent</p>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <CardDescription>
              No pitch yet. Generated from this lead&apos;s company evidence — nothing invented.
            </CardDescription>
            <GeneratePitchButton leadId={lead.id} />
          </div>
        )}
      </Card>

      <StageActionsPanel leadId={lead.id} status={lead.status} />

      {followups.length > 0 || meetings.length > 0 ? (
        <Card>
          <CardTitle>Activity</CardTitle>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink-muted">
            {meetings.map((m) => (
              <li key={m.id}>Meeting logged for {new Date(m.scheduled_at).toLocaleDateString()}</li>
            ))}
            {followups.map((f) => (
              <li key={f.id}>
                Follow-up due {new Date(f.due_at).toLocaleDateString()}
                {f.note ? ` — ${f.note}` : ""}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </main>
  );
}
