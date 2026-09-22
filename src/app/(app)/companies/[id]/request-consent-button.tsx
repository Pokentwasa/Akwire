"use client";

import { useActionState } from "react";
import { requestConsentAction } from "@/app/(app)/compliance/actions";
import { Button } from "@/components/ui/button";

export function RequestConsentButton({ companyId }: { companyId: string }) {
  const [state, formAction, pending] = useActionState(requestConsentAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="companyId" value={companyId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Requesting…" : "Request consent"}
      </Button>
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
