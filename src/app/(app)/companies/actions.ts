"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCompany, rejectCompany, shortlistCompany } from "@/domain/companies/commands";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";

export async function createCompanyAction(_prevState: unknown, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  const evidence: Record<string, string | number | boolean | null> = {};
  for (const field of webDesignLocalBusinessPack.evidenceFields) {
    const raw = formData.get(field.key);
    if (raw === null || raw === "") {
      evidence[field.key] = null;
    } else if (field.kind === "boolean") {
      evidence[field.key] = raw === "true";
    } else if (field.kind === "number") {
      const parsed = Number(raw);
      evidence[field.key] = Number.isFinite(parsed) ? parsed : null;
    } else {
      evidence[field.key] = String(raw);
    }
  }

  let companyId: string;
  try {
    const result = await createCompany(org.id, {
      name: String(formData.get("name") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      city: String(formData.get("city") ?? ""),
      region: String(formData.get("region") ?? ""),
      country: String(formData.get("country") ?? ""),
      website: String(formData.get("website") ?? ""),
      packId: webDesignLocalBusinessPack.id,
      evidence,
    });
    companyId = result.company.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }

  redirect(`/companies/${companyId}`);
}

export async function shortlistCompanyAction(companyId: string) {
  const org = await getCurrentOrganisation();
  if (!org) return;
  await shortlistCompany(org.id, companyId);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
}

export async function rejectCompanyAction(companyId: string) {
  const org = await getCurrentOrganisation();
  if (!org) return;
  await rejectCompany(org.id, companyId);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
}
