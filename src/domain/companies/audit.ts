import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import { safeFetchHtml } from "@/integrations/audit/fetch";
import { parseSignals } from "@/integrations/audit/signals";
import { scoreOpportunity, type EvidenceValues } from "@/domain/opportunities/engine";
import { OPPORTUNITY_PACKS } from "@/opportunity-packs/web-design-local-business";

/**
 * Deep research (section 12): fetch the company's actual website and turn
 * what's observable into evidence, then re-score. Everything written here
 * is traceable to a fetched page — see docs/SCORING.md's evidence
 * traceability rule. No PageSpeed integration yet (needs an API key not
 * configured in this environment — docs/SETUP.md); the signals below don't
 * require one.
 */
export async function auditCompanyWebsite(organisationId: string, companyId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("id", companyId)
    .single();

  if (companyError || !company) throw new Error("Company not found");
  if (!company.website) throw new Error("This company has no website to audit");

  const { html, finalUrl } = await safeFetchHtml(company.website);
  const signals = parseSignals(html, finalUrl);

  const auditEvidence: EvidenceValues = {
    hasWebsite: true,
    poorMobileExperience: !signals.hasViewportMeta,
    unclearCta: !signals.hasCta,
    noBookingOrEnquiryPath: !signals.hasBookingOrOrderLink,
    weakSeoStructure: !signals.title || !signals.metaDescription || signals.h1Count === 0,
  };

  const auditRows = Object.entries(auditEvidence).map(([type, value]) => ({
    company_id: companyId,
    organisation_id: organisationId,
    type,
    source: "audit",
    value: { value, url: finalUrl },
    confidence: "high" as const,
  }));

  const { error: evidenceError } = await supabase.from("evidence").insert(auditRows);
  if (evidenceError) throw new Error(`Failed to save audit evidence: ${evidenceError.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "company",
    entityId: companyId,
    action: "audit_completed",
    metadata: { url: finalUrl },
  });

  // Merge with prior evidence (manual + earlier audits) so fields the audit
  // can't determine — googleRating, reviewCount, outdatedDesign — aren't
  // lost. The freshest value per field wins.
  const { data: allEvidence, error: allEvidenceError } = await supabase
    .from("evidence")
    .select("type, value, collected_at")
    .eq("organisation_id", organisationId)
    .eq("company_id", companyId)
    .order("collected_at", { ascending: true });

  if (allEvidenceError) throw new Error(`Failed to load evidence: ${allEvidenceError.message}`);

  const merged: EvidenceValues = {};
  for (const row of allEvidence ?? []) {
    merged[row.type] = (row.value as { value: EvidenceValues[string] }).value;
  }

  const pack = OPPORTUNITY_PACKS["web-design-local-business"];
  const scored = scoreOpportunity(pack, company.industry, merged);

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .insert({
      organisation_id: organisationId,
      company_id: companyId,
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
    throw new Error(`Failed to re-score opportunity: ${opportunityError.message}`);
  }

  await supabase
    .from("companies")
    .update({ status: company.status === "rejected" ? "rejected" : "researched" })
    .eq("id", companyId)
    .eq("organisation_id", organisationId);

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "opportunity",
    entityId: opportunity.id,
    action: "opportunity_rescored",
    metadata: { opportunityScore: scored.opportunityScore, source: "audit" },
  });

  return { opportunity, scored, signals };
}
