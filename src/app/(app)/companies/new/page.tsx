"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCompanyAction } from "@/app/(app)/companies/actions";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewCompanyPage() {
  const [state, formAction, pending] = useActionState(createCompanyAction, undefined);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <Link href="/companies" className="text-sm text-ink-muted hover:text-ink">
          ← Companies
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Add a company</h1>
        <p className="text-ink-muted">
          Enter what you know. Yebo scores the opportunity from whatever evidence you give it —
          unknown fields stay unknown, they&apos;re not guessed.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Company details</CardTitle>
            <CardDescription>{webDesignLocalBusinessPack.name} pack</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" name="name" required minLength={2} placeholder="Harbour Table" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Select id="industry" name="industry" defaultValue="">
                <option value="">Not specified</option>
                {webDesignLocalBusinessPack.supportedIndustries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" placeholder="https://" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Cape Town" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" placeholder="South Africa" />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
            <CardDescription>
              Leave anything you don&apos;t know blank — it stays unknown rather than being guessed.
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {webDesignLocalBusinessPack.evidenceFields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.kind === "number" ? (
                  <Input id={field.key} name={field.key} type="number" step="any" />
                ) : (
                  <Select id={field.key} name={field.key} defaultValue="">
                    <option value="">Not checked</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Select>
                )}
                {field.helpText ? (
                  <p className="text-xs text-ink-muted">{field.helpText}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        {state?.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} size="lg" className="self-start">
          {pending ? "Scoring opportunity…" : "Save and score"}
        </Button>
      </form>
    </main>
  );
}
