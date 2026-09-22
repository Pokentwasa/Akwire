"use client";

import { useActionState } from "react";
import { auditCompanyAction } from "@/app/(app)/companies/actions";
import { Button } from "@/components/ui/button";

export function AuditButton({ companyId }: { companyId: string }) {
  const [state, formAction, pending] = useActionState(auditCompanyAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="companyId" value={companyId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Fetching website…" : "Run website audit"}
      </Button>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
