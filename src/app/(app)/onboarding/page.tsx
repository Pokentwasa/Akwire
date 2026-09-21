"use client";

import { useActionState } from "react";
import { createOrganisationAction } from "@/app/(app)/onboarding/actions";
import { OnboardingStep } from "@/app/(app)/onboarding/onboarding-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingOrganisationPage() {
  const [state, formAction, pending] = useActionState(createOrganisationAction, undefined);

  return (
    <OnboardingStep
      step={1}
      total={4}
      title="Name your organisation"
      description="This is the business using Yebo to find customers."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Organisation name</Label>
          <Input id="name" name="name" placeholder="Poke Digital" required minLength={2} />
        </div>
        {state?.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="mt-2">
          {pending ? "Saving…" : "Continue"}
        </Button>
      </form>
    </OnboardingStep>
  );
}
