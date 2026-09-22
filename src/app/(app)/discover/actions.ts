"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import { importDiscoveredCompanies } from "@/domain/companies/discovery";
import { parseCompaniesCsv, CsvImportError } from "@/integrations/discovery/csv";
import { googlePlacesProvider } from "@/integrations/discovery/google-places";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";
import type { NormalizedCompany } from "@/integrations/discovery/types";

export type DiscoverActionState = {
  error?: string;
  success?: string;
  results?: NormalizedCompany[];
};

export async function importCsvAction(
  _prevState: DiscoverActionState | undefined,
  formData: FormData,
): Promise<DiscoverActionState> {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  const file = formData.get("file");
  let content = String(formData.get("csvText") ?? "");
  if (file instanceof File && file.size > 0) {
    content = await file.text();
  }
  if (!content.trim()) return { error: "Paste CSV text or choose a file" };

  let companies;
  try {
    companies = parseCompaniesCsv(content);
  } catch (error) {
    return { error: error instanceof CsvImportError ? error.message : "Could not parse that CSV" };
  }

  const result = await importDiscoveredCompanies(org.id, webDesignLocalBusinessPack.id, companies);
  revalidatePath("/companies");
  revalidatePath("/today");
  return {
    success: `Imported ${result.imported} companies${result.skipped > 0 ? ` (${result.skipped} skipped as duplicates)` : ""}.`,
  };
}

export async function searchGooglePlacesAction(
  _prevState: DiscoverActionState | undefined,
  formData: FormData,
): Promise<DiscoverActionState> {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  const what = String(formData.get("what") ?? "").trim();
  const where = String(formData.get("where") ?? "").trim();
  if (!what || !where) return { error: "Tell Yebo what to search for and where" };

  try {
    const results = await googlePlacesProvider.search({ what, where });
    if (results.length === 0) return { error: "No results — try a different search" };
    return { results };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Search failed" };
  }
}

export async function importSelectedAction(
  _prevState: DiscoverActionState | undefined,
  formData: FormData,
): Promise<DiscoverActionState> {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  let companies: NormalizedCompany[];
  try {
    companies = JSON.parse(String(formData.get("companies") ?? "[]"));
  } catch {
    return { error: "Something went wrong reading your selection" };
  }
  if (companies.length === 0) return { error: "Select at least one company" };

  const result = await importDiscoveredCompanies(org.id, webDesignLocalBusinessPack.id, companies);
  revalidatePath("/companies");
  revalidatePath("/today");
  return {
    success: `Imported ${result.imported} companies${result.skipped > 0 ? ` (${result.skipped} skipped as duplicates)` : ""}.`,
  };
}
