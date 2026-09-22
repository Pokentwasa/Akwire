"use client";

import { useActionState } from "react";
import { saveIcpAction } from "@/app/(app)/onboarding/actions";
import { OnboardingStep } from "@/app/(app)/onboarding/onboarding-step";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingIcpPage() {
  const [state, formAction, pending] = useActionState(saveIcpAction, undefined);

  return (
    <OnboardingStep
      step={3}
      total={4}
      title="Who should Yebo find?"
      description="Describe your ideal prospect. You can refine this later."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetIndustries">Target industries (comma-separated)</Label>
          <Input
            id="targetIndustries"
            name="targetIndustries"
            placeholder="Restaurants, Hotels, Architecture firms"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="geography">Geography (comma-separated)</Label>
          <Input id="geography" name="geography" placeholder="Cape Town, South Africa" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Describe your ideal prospect</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Established businesses with strong reputations but weak digital experiences."
          />
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
