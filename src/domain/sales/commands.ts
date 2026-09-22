import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import { assertValidTransition, type LeadStatus } from "@/domain/leads/pipeline";
import { generatePitchEmail } from "@/domain/sales/pitch-generator";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getLeadOrThrow(supabase: SupabaseServerClient, organisationId: string, leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("id", leadId)
    .single();
  if (error || !data) throw new Error("Lead not found");
  return data;
}

async function transitionLead(
  supabase: SupabaseServerClient,
  organisationId: string,
  leadId: string,
  currentStatus: string,
  nextStatus: LeadStatus,
) {
  assertValidTransition(currentStatus as LeadStatus, nextStatus);
  const { error } = await supabase
    .from("leads")
    .update({ status: nextStatus })
    .eq("id", leadId)
    .eq("organisation_id", organisationId);
  if (error) throw new Error(`Failed to update lead: ${error.message}`);
}

export async function generatePitch(organisationId: string, leadId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  const lead = await getLeadOrThrow(supabase, organisationId, leadId);
  if (!lead.company_id) throw new Error("This lead isn't linked to a company yet");

  const [{ data: company }, { data: opportunity }, { data: senderProfile }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", lead.company_id).single(),
    supabase
      .from("opportunities")
      .select("recommended_service, explanation")
      .eq("company_id", lead.company_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sender_profiles")
      .select("business_name")
      .eq("organisation_id", organisationId)
      .maybeSingle(),
  ]);

  if (!company) throw new Error("Company not found");

  const pack = webDesignLocalBusinessPack;
  const generated = generatePitchEmail({
    companyName: company.name,
    recommendedService: opportunity?.recommended_service ?? pack.recommendedService,
    explanation: (opportunity?.explanation as string[]) ?? [],
    offer: pack.offers[0],
    senderBusinessName: senderProfile?.business_name ?? "Your team",
  });

  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .insert({
      organisation_id: organisationId,
      lead_id: leadId,
      company_id: lead.company_id,
      subject: generated.subject,
      body: generated.body,
      status: "draft",
    })
    .select()
    .single();
  if (pitchError) throw new Error(`Failed to save pitch: ${pitchError.message}`);

  if (lead.status !== "pitch_ready") {
    await transitionLead(supabase, organisationId, leadId, lead.status, "pitch_ready");
  }

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "pitch",
    entityId: pitch.id,
    action: "pitch_generated",
  });

  return pitch;
}

export async function markPitchSent(organisationId: string, pitchId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("id", pitchId)
    .single();
  if (pitchError || !pitch) throw new Error("Pitch not found");

  const lead = await getLeadOrThrow(supabase, organisationId, pitch.lead_id);
  await transitionLead(supabase, organisationId, pitch.lead_id, lead.status, "pitch_sent");

  const { error } = await supabase
    .from("pitches")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", pitchId);
  if (error) throw new Error(`Failed to mark pitch sent: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "pitch",
    entityId: pitchId,
    action: "pitch_sent",
  });
}

export async function scheduleFollowup(
  organisationId: string,
  leadId: string,
  dueAt: string,
  note: string,
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data: followup, error } = await supabase
    .from("followups")
    .insert({ organisation_id: organisationId, lead_id: leadId, due_at: dueAt, note: note || null })
    .select()
    .single();
  if (error) throw new Error(`Failed to schedule follow-up: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "lead",
    entityId: leadId,
    action: "followup_scheduled",
    metadata: { dueAt },
  });

  return followup;
}

export async function markMeetingBooked(
  organisationId: string,
  leadId: string,
  scheduledAt: string,
  notes: string,
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const lead = await getLeadOrThrow(supabase, organisationId, leadId);
  await transitionLead(supabase, organisationId, leadId, lead.status, "meeting");

  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      organisation_id: organisationId,
      lead_id: leadId,
      scheduled_at: scheduledAt,
      notes: notes || null,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to log meeting: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "lead",
    entityId: leadId,
    action: "meeting_booked",
  });

  return meeting;
}

export async function markProposalSent(organisationId: string, leadId: string, title: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const lead = await getLeadOrThrow(supabase, organisationId, leadId);
  await transitionLead(supabase, organisationId, leadId, lead.status, "proposal");

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      organisation_id: organisationId,
      lead_id: leadId,
      title,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to log proposal: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "lead",
    entityId: leadId,
    action: "proposal_sent",
  });

  return proposal;
}

export async function markWon(organisationId: string, leadId: string, valueCents: number | null) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const lead = await getLeadOrThrow(supabase, organisationId, leadId);
  await transitionLead(supabase, organisationId, leadId, lead.status, "won");

  const { error } = await supabase.from("deals").insert({
    organisation_id: organisationId,
    lead_id: leadId,
    company_id: lead.company_id,
    value_cents: valueCents,
    status: "won",
    closed_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to record deal: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "lead",
    entityId: leadId,
    action: "deal_won",
    metadata: { valueCents },
  });
}

export async function markLost(organisationId: string, leadId: string, reason: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const lead = await getLeadOrThrow(supabase, organisationId, leadId);
  await transitionLead(supabase, organisationId, leadId, lead.status, "lost");

  const { error } = await supabase.from("deals").insert({
    organisation_id: organisationId,
    lead_id: leadId,
    company_id: lead.company_id,
    status: "lost",
    lost_reason: reason || null,
    closed_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to record deal: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "lead",
    entityId: leadId,
    action: "deal_lost",
    metadata: { reason },
  });
}
