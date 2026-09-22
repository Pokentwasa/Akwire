"use client";

import { useActionState } from "react";
import {
  generatePitchAction,
  markLostAction,
  markMeetingAction,
  markPitchSentAction,
  markProposalAction,
  markWonAction,
  scheduleFollowupAction,
} from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle } from "@/components/ui/card";

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {error}
    </p>
  );
}

const TERMINAL = new Set(["won", "lost", "declined", "suppressed"]);

export function GeneratePitchButton({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState(generatePitchAction, undefined);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate pitch"}
      </Button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function MarkPitchSentButton({ leadId, pitchId }: { leadId: string; pitchId: string }) {
  const [state, formAction, pending] = useActionState(markPitchSentAction, undefined);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="pitchId" value={pitchId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Marking sent…" : "Mark pitch sent"}
      </Button>
      <ErrorText error={state?.error} />
    </form>
  );
}

export function StageActionsPanel({ leadId, status }: { leadId: string; status: string }) {
  const followup = useActionState(scheduleFollowupAction, undefined);
  const meeting = useActionState(markMeetingAction, undefined);
  const proposal = useActionState(markProposalAction, undefined);
  const won = useActionState(markWonAction, undefined);
  const lost = useActionState(markLostAction, undefined);

  if (TERMINAL.has(status)) {
    return (
      <Card>
        <CardTitle>This lead is closed</CardTitle>
        <p className="mt-1 text-sm text-ink-muted capitalize">Status: {status.replace(/_/g, " ")}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardTitle>Schedule follow-up</CardTitle>
        <form action={followup[1]} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="leadId" value={leadId} />
          <Label htmlFor="dueAt">Due</Label>
          <Input id="dueAt" name="dueAt" type="date" required />
          <Input name="note" placeholder="Note (optional)" />
          <Button type="submit" size="sm" variant="secondary" disabled={followup[2]}>
            Schedule
          </Button>
          <ErrorText error={followup[0]?.error} />
        </form>
      </Card>

      <Card>
        <CardTitle>Log a meeting</CardTitle>
        <form action={meeting[1]} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="leadId" value={leadId} />
          <Label htmlFor="scheduledAt">Date</Label>
          <Input id="scheduledAt" name="scheduledAt" type="date" required />
          <Input name="notes" placeholder="Notes (optional)" />
          <Button type="submit" size="sm" variant="secondary" disabled={meeting[2]}>
            Log meeting
          </Button>
          <ErrorText error={meeting[0]?.error} />
        </form>
      </Card>

      <Card>
        <CardTitle>Send proposal</CardTitle>
        <form action={proposal[1]} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="leadId" value={leadId} />
          <Input name="title" placeholder="Proposal title" defaultValue="Website redesign proposal" />
          <Button type="submit" size="sm" variant="secondary" disabled={proposal[2]}>
            Mark proposal sent
          </Button>
          <ErrorText error={proposal[0]?.error} />
        </form>
      </Card>

      <Card>
        <CardTitle>Close</CardTitle>
        <div className="mt-3 flex flex-col gap-4">
          <form action={won[1]} className="flex flex-col gap-2">
            <input type="hidden" name="leadId" value={leadId} />
            <Input name="valueCents" type="number" placeholder="Deal value (ZAR, optional)" />
            <Button type="submit" size="sm" disabled={won[2]}>
              Mark won
            </Button>
            <ErrorText error={won[0]?.error} />
          </form>
          <form action={lost[1]} className="flex flex-col gap-2">
            <input type="hidden" name="leadId" value={leadId} />
            <Input name="reason" placeholder="Reason (optional)" />
            <Button type="submit" size="sm" variant="destructive" disabled={lost[2]}>
              Mark lost
            </Button>
            <ErrorText error={lost[0]?.error} />
          </form>
        </div>
      </Card>
    </div>
  );
}
