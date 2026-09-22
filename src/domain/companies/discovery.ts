import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import { scoreOpportunity, type EvidenceValues } from "@/domain/opportunities/engine";
import { OPPORTUNITY_PACKS, type OpportunityPackId } from "@/opportunity-packs/web-design-local-business";
import type { NormalizedCompany } from "@/integrations/discovery/types";

export type ImportResult = { imported: number; skipped: number };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Turns normalized records from any DiscoveryProvider into scored
 * companies. Dedupes within the organisation — by provider + external id
 * when the source has one (e.g. a Google Place ID), otherwise by name +
 * website (e.g. CSV rows). Section 8/41 of the brief.
 */
export async function importDiscoveredCompanies(
  organisationId: string,
  packId: string,
  companies: NormalizedCompany[],
): Promise<ImportResult> {
  const pack = OPPORTUNITY_PACKS[packId as OpportunityPackId];
  if (!pack) throw new Error(`Unknown Opportunity Pack: ${packId}`);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  let imported = 0;
  let skipped = 0;

  for (const record of companies) {
    const isDuplicate = record.sourceExternalId
      ? await hasExistingSource(supabase, organisationId, record)
      : await hasExistingCompany(supabase, organisationId, record);

    if (isDuplicate) {
      skipped++;
      continue;
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        organisation_id: organisationId,
        name: record.name,
        industry: record.industry ?? null,
        city: record.city ?? null,
        region: record.region ?? null,
        country: record.country ?? null,
        website: record.website ?? null,
        created_by: actorUserId,
      })
      .select()
      .single();

    if (companyError || !company) {
      skipped++;
      continue;
    }

    await supabase.from("company_sources").insert({
      organisation_id: organisationId,
      company_id: company.id,
      provider: record.sourceProvider,
      provider_external_id: record.sourceExternalId ?? null,
      source_url: record.sourceUrl ?? null,
      metadata: record.metadata ?? {},
    });

    const evidence = extractEvidence(record);
    if (Object.keys(evidence).length > 0) {
      await supabase.from("evidence").insert(
        Object.entries(evidence).map(([type, value]) => ({
          company_id: company.id,
          organisation_id: organisationId,
          type,
          source: record.sourceProvider,
          value: { value },
          confidence: "medium",
        })),
      );
    }

    const scored = scoreOpportunity(pack, record.industry ?? null, evidence);
    await supabase.from("opportunities").insert({
      organisation_id: organisationId,
      company_id: company.id,
      pack_id: pack.id,
      icp_fit: scored.icpFit,
      business_quality: scored.businessQuality,
      service_gap: scored.serviceGap,
      timing_score: scored.timingScore,
      opportunity_score: scored.opportunityScore,
      confidence: scored.confidence,
      recommended_service: scored.recommendedService,
      explanation: scored.explanation,
    });

    imported++;
  }

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "organisation",
    entityId: organisationId,
    action: "companies_discovered",
    metadata: { imported, skipped },
  });

  return { imported, skipped };
}

function extractEvidence(record: NormalizedCompany): EvidenceValues {
  const evidence: EvidenceValues = {};
  const rating = record.metadata?.rating;
  const reviewCount = record.metadata?.userRatingCount;
  if (typeof rating === "number") evidence.googleRating = rating;
  if (typeof reviewCount === "number") evidence.reviewCount = reviewCount;
  if (record.website) evidence.hasWebsite = true;
  return evidence;
}

async function hasExistingSource(
  supabase: SupabaseServerClient,
  organisationId: string,
  record: NormalizedCompany,
) {
  const { data } = await supabase
    .from("company_sources")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("provider", record.sourceProvider)
    .eq("provider_external_id", record.sourceExternalId)
    .maybeSingle();
  return Boolean(data);
}

async function hasExistingCompany(
  supabase: SupabaseServerClient,
  organisationId: string,
  record: NormalizedCompany,
) {
  let query = supabase
    .from("companies")
    .select("id")
    .eq("organisation_id", organisationId)
    .ilike("name", record.name);
  if (record.website) query = query.eq("website", record.website);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}
