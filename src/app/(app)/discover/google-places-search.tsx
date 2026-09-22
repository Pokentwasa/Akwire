"use client";

import { useActionState, useState } from "react";
import { importSelectedAction, searchGooglePlacesAction } from "@/app/(app)/discover/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GooglePlacesSearch() {
  const [searchState, searchAction, searching] = useActionState(
    searchGooglePlacesAction,
    undefined,
  );
  const [importState, importAction, importing] = useActionState(importSelectedAction, undefined);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const results = searchState?.results ?? [];

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Google Places</CardTitle>
        <CardDescription>What are you selling, and where should Yebo look?</CardDescription>
      </CardHeader>
      <form action={searchAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="what">What</Label>
          <Input id="what" name="what" placeholder="Restaurants" required />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="where">Where</Label>
          <Input id="where" name="where" placeholder="Cape Town" required />
        </div>
        <Button type="submit" disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </Button>
      </form>
      {searchState?.error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {searchState.error}
        </p>
      ) : null}

      {results.length > 0 ? (
        <form action={importAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="companies" value={JSON.stringify(results.filter((_, i) => selected.has(i)))} />
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {results.map((company, i) => (
              <li key={company.sourceExternalId ?? i} className="flex items-center gap-3 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 rounded border-border text-accent"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{company.name}</p>
                  <p className="text-xs text-ink-muted">
                    {String(company.metadata?.formattedAddress ?? "")}
                    {typeof company.metadata?.rating === "number"
                      ? ` · ${company.metadata.rating}★ (${company.metadata.userRatingCount ?? 0})`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Button type="submit" disabled={importing || selected.size === 0} className="self-start">
            {importing ? "Importing…" : `Import ${selected.size || ""} selected`.trim()}
          </Button>
        </form>
      ) : null}
      {importState?.error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {importState.error}
        </p>
      ) : null}
      {importState?.success ? (
        <p className="mt-3 text-sm text-success">{importState.success}</p>
      ) : null}
    </Card>
  );
}
