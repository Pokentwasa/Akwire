"use client";

import { useActionState } from "react";
import { saveOfferingAction } from "@/app/(app)/onboarding/actions";
import { OnboardingStep } from "@/app/(app)/onboarding/onboarding-step";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingOfferingPage() {
  const [state, formAction, pending] = useActionState(saveOfferingAction, undefined);

  return (
    <OnboardingStep
      step={2}
      total={4}
      title="What do you sell?"
      description="Yebo uses this to decide which companies are worth pursuing."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Offering name</Label>
          <Input id="name" name="name" placeholder="Website design" required minLength={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="services">Services / products (comma-separated)</Label>
          <Input
            id="services"
            name="services"
            placeholder="Website design, Web development, SEO"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Anything else worth knowing?</Label>
          <Textarea id="description" name="description" rows={3} />
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
