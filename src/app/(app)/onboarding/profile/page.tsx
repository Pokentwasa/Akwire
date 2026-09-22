"use client";

import { useActionState } from "react";
import { saveProfileAction } from "@/app/(app)/onboarding/actions";
import { OnboardingStep } from "@/app/(app)/onboarding/onboarding-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingProfilePage() {
  const [state, formAction, pending] = useActionState(saveProfileAction, undefined);

  return (
    <OnboardingStep
      step={4}
      total={4}
      title="Your sender profile"
      description="How Yebo introduces your business in outreach and pitches."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" name="businessName" required minLength={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" placeholder="https://" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" />
        </div>
        {state?.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Saving…" : "Finish setup"}
        </Button>
      </form>
    </OnboardingStep>
  );
}
