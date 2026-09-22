import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function listCompanies(organisationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*, opportunities(opportunity_score, confidence, recommended_service, status)")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load companies: ${error.message}`);
  return data;
}

export async function getCompanyWorkspace(organisationId: string, companyId: string) {
  const supabase = await createClient();

  const [{ data: company, error: companyError }, { data: evidence, error: evidenceError }, { data: opportunities, error: opportunityError }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("id", companyId)
        .single(),
      supabase
        .from("evidence")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("company_id", companyId)
        .order("collected_at", { ascending: false }),
      supabase
        .from("opportunities")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
    ]);

  if (companyError) return null;
  if (evidenceError) throw new Error(`Failed to load evidence: ${evidenceError.message}`);
  if (opportunityError) throw new Error(`Failed to load opportunities: ${opportunityError.message}`);

  return { company, evidence: evidence ?? [], opportunities: opportunities ?? [] };
}
