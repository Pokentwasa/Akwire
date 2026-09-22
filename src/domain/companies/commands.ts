import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import { createCompanyInput, type CreateCompanyInput } from "@/domain/companies/schema";
import { scoreOpportunity } from "@/domain/opportunities/engine";
import { OPPORTUNITY_PACKS, type OpportunityPackId } from "@/opportunity-packs/web-design-local-business";

export async function createCompany(organisationId: string, raw: CreateCompanyInput) {
  const input = createCompanyInput.parse(raw);
  const pack = OPPORTUNITY_PACKS[input.packId as OpportunityPackId];
  if (!pack) throw new Error(`Unknown Opportunity Pack: ${input.packId}`);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      organisation_id: organisationId,
      name: input.name,
      industry: input.industry || null,
      city: input.city || null,
      region: input.region || null,
      country: input.country || null,
      website: input.website || null,
      created_by: actorUserId,
    })
    .select()
    .single();

  if (companyError) throw new Error(`Failed to create company: ${companyError.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "company",
    entityId: company.id,
    action: "company_created",
  });

  const evidenceEntries = Object.entries(input.evidence).filter(([, value]) => value !== null);

  if (evidenceEntries.length > 0) {
    const { error: evidenceError } = await supabase.from("evidence").insert(
      evidenceEntries.map(([type, value]) => ({
        company_id: company.id,
        organisation_id: organisationId,
        type,
        source: "manual",
        value: { value },
        confidence: "medium",
      })),
    );
    if (evidenceError) throw new Error(`Failed to save evidence: ${evidenceError.message}`);
  }

  const scored = scoreOpportunity(pack, input.industry || null, input.evidence);

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .insert({
      organisation_id: organisationId,
      company_id: company.id,
      offering_id: input.offeringId ?? null,
      pack_id: pack.id,
      icp_fit: scored.icpFit,
      business_quality: scored.businessQuality,
      service_gap: scored.serviceGap,
      timing_score: scored.timingScore,
      opportunity_score: scored.opportunityScore,
      confidence: scored.confidence,
      recommended_service: scored.recommendedService,
      explanation: scored.explanation,
    })
    .select()
    .single();

  if (opportunityError) {
    throw new Error(`Failed to score opportunity: ${opportunityError.message}`);
  }

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "opportunity",
    entityId: opportunity.id,
    action: "opportunity_scored",
    metadata: { opportunityScore: scored.opportunityScore, confidence: scored.confidence },
  });

  return { company, opportunity: { ...opportunity, recommendedAction: scored.recommendedAction } };
}

async function setCompanyStatus(
  organisationId: string,
  companyId: string,
  status: "shortlisted" | "rejected",
  action: string,
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("id", companyId)
    .eq("organisation_id", organisationId);

  if (error) throw new Error(`Failed to update company: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "company",
    entityId: companyId,
    action,
  });
}

export async function shortlistCompany(organisationId: string, companyId: string) {
  return setCompanyStatus(organisationId, companyId, "shortlisted", "company_shortlisted");
}

export async function rejectCompany(organisationId: string, companyId: string) {
  return setCompanyStatus(organisationId, companyId, "rejected", "company_rejected");
}
