"use client";

import { useActionState } from "react";
import { createCampaignAction } from "@/app/(app)/campaigns/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpportunityPack } from "@/opportunity-packs/types";

type CompanyRow = {
  id: string;
  name: string;
  status: string;
  opportunities?: { opportunity_score: number }[];
};

export function CampaignForm({
  companies,
  pack,
}: {
  companies: CompanyRow[];
  pack: OpportunityPack;
}) {
  const [state, formAction, pending] = useActionState(createCampaignAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Campaign name</Label>
            <Input id="name" name="name" required minLength={2} placeholder="Cape Town Restaurant Website Opportunity" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="angle">Angle</Label>
            <Select id="angle" name="angle" defaultValue={pack.campaignAngles[0]}>
              {pack.campaignAngles.map((angle) => (
                <option key={angle} value={angle}>
                  {angle}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offer">Offer</Label>
            <Select id="offer" name="offer" defaultValue={pack.offers[0]}>
              {pack.offers.map((offer) => (
                <option key={offer} value={offer}>
                  {offer}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target companies</CardTitle>
        </CardHeader>
        {companies.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No companies yet — add or discover some first.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {companies.map((company) => (
              <li key={company.id} className="flex items-center gap-3 px-3 py-2">
                <input
                  type="checkbox"
                  name="companyIds"
                  value={company.id}
                  defaultChecked={company.status === "shortlisted"}
                  className="h-4 w-4 rounded border-border text-accent"
                />
                <span className="flex-1 text-sm text-ink">{company.name}</span>
                <span className="text-xs text-ink-muted">
                  {company.opportunities?.[0]?.opportunity_score ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || companies.length === 0} size="lg" className="self-start">
        {pending ? "Generating campaign…" : "Generate campaign"}
      </Button>
    </form>
  );
}
