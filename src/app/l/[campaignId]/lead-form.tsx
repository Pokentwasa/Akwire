"use client";

import { useActionState } from "react";
import { submitLeadAction } from "@/app/l/[campaignId]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function LeadForm({ campaignId }: { campaignId: string }) {
  const [state, formAction, pending] = useActionState(
    submitLeadAction.bind(null, campaignId),
    undefined,
  );

  if (state && "success" in state && state.success) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised p-6 text-center">
        <p className="font-display text-lg font-semibold text-ink">Thanks — got it.</p>
        <p className="mt-1 text-sm text-ink-muted">Someone will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="businessName">Business name</Label>
        <Input id="businessName" name="businessName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" placeholder="https://" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="improvementArea">What would you most like to improve?</Label>
        <Select id="improvementArea" name="improvementArea" defaultValue="">
          <option value="">Not sure</option>
          <option value="Website">Website</option>
          <option value="Google visibility">Google visibility</option>
          <option value="Lead generation">Lead generation</option>
          <option value="Online bookings">Online bookings</option>
        </Select>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Sending…" : "Claim your free audit"}
      </Button>
      <p className="text-xs text-ink-muted">
        Placeholder privacy/consent wording — must be reviewed by South African legal counsel
        before real use (see docs/LEGAL_REVIEW.md). We&apos;ll only use your details to follow up
        about this audit.
      </p>
    </form>
  );
}
