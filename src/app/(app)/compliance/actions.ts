"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { requestConsent, withdrawConsent } from "@/domain/compliance/commands";

export async function requestConsentAction(_prevState: unknown, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  const companyId = String(formData.get("companyId") ?? "");

  try {
    await requestConsent(org.id, {
      companyId,
      channel: "email",
      scope: "Website redesign services",
      wordingVersion: "draft-v0-unreviewed",
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to request consent" };
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/compliance");
  return { error: undefined };
}

export async function withdrawConsentAction(consentRequestId: string) {
  const org = await getCurrentOrganisation();
  if (!org) return;
  await withdrawConsent(org.id, consentRequestId);
  revalidatePath("/compliance");
}
