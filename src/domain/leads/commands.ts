import "server-only";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import {
  publicLeadSubmissionInput,
  recordLeadInput,
  type PublicLeadSubmissionInput,
  type RecordLeadInput,
} from "@/domain/leads/schema";

export async function recordLead(organisationId: string, raw: RecordLeadInput) {
  const input = recordLeadInput.parse(raw);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      organisation_id: organisationId,
      company_id: input.companyId ?? null,
      campaign_id: input.campaignId ?? null,
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      email: input.email || null,
      phone: input.phone || null,
      role: input.role || null,
      source: input.source,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to record lead: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "lead",
    entityId: lead.id,
    action: "lead_recorded",
    metadata: { source: input.source },
  });

  return lead;
}

/**
 * Public lead capture (section 19/20) — the submitter is an anonymous
 * visitor, not a signed-in Yebo user, so there's no session for RLS to
 * scope against. This uses the service-role client from a trusted server
 * action (never exposed to the browser) and does its own tenant
 * resolution: the campaign id in the URL determines the organisation, and
 * nothing here reads back another organisation's data.
 */
export async function submitPublicLead(campaignId: string, raw: PublicLeadSubmissionInput) {
  const input = publicLeadSubmissionInput.parse(raw);
  const supabase = createServiceRoleClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, organisation_id")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error("This campaign link is no longer valid.");
  }

  const [firstName, ...rest] = input.name.trim().split(/\s+/);

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      organisation_id: campaign.organisation_id,
      campaign_id: campaign.id,
      first_name: firstName || null,
      last_name: rest.join(" ") || null,
      email: input.email,
      source: "yebo_form",
      status: "new",
    })
    .select()
    .single();

  if (leadError) throw new Error(`Failed to save your details: ${leadError.message}`);

  const { error: submissionError } = await supabase.from("lead_submissions").insert({
    organisation_id: campaign.organisation_id,
    lead_id: lead.id,
    campaign_id: campaign.id,
    form_id: "campaign_lead_form",
    submission_data: {
      businessName: input.businessName,
      website: input.website || null,
      name: input.name,
      email: input.email,
      improvementArea: input.improvementArea || null,
    },
  });

  if (submissionError) {
    throw new Error(`Failed to save your submission: ${submissionError.message}`);
  }

  await logActivity(supabase, {
    organisationId: campaign.organisation_id,
    actorUserId: null,
    entityType: "lead",
    entityId: lead.id,
    action: "lead_captured",
    metadata: { campaignId: campaign.id, source: "yebo_form" },
  });

  return lead;
}
