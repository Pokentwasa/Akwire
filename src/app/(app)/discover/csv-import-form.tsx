"use client";

import { useActionState } from "react";
import { importCsvAction } from "@/app/(app)/discover/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CsvImportForm() {
  const [state, formAction, pending] = useActionState(importCsvAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from CSV</CardTitle>
        <CardDescription>
          Columns: name (required), industry, city, region, country, website.
        </CardDescription>
      </CardHeader>
      <form action={formAction} className="flex flex-col gap-3">
        <Textarea
          name="csvText"
          rows={6}
          placeholder={"name,industry,city,website\nHarbour Table,Restaurant,Cape Town,https://harbourtable.example"}
        />
        <div className="flex items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="text-sm text-ink-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm"
          />
          <Button type="submit" disabled={pending} className="ml-auto">
            {pending ? "Importing…" : "Import"}
          </Button>
        </div>
        {state?.error ? (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        ) : null}
        {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
      </form>
    </Card>
  );
}
