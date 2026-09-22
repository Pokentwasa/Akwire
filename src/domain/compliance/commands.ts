import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import { requestConsentInput, type RequestConsentInput } from "@/domain/compliance/schema";

/**
 * Technical enforcement only — see docs/LEGAL_REVIEW.md. The actual
 * wording shown to a recipient is tracked by version (`wordingVersion`)
 * but not authored here; nothing in this file should be read as legal
 * advice or a compliance guarantee.
 */

export async function isSuppressed(organisationId: string, companyId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppression")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("company_id", companyId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function requestConsent(organisationId: string, raw: RequestConsentInput) {
  const input = requestConsentInput.parse(raw);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  if (await isSuppressed(organisationId, input.companyId)) {
    throw new Error("This company is suppressed and cannot be contacted.");
  }

  const { data: consentRequest, error } = await supabase
    .from("consent_requests")
    .insert({
      organisation_id: organisationId,
      company_id: input.companyId,
      channel: input.channel,
      scope: input.scope,
      wording_version: input.wordingVersion,
      status: "pending",
      requested_by: actorUserId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        `A consent request has already been sent to this company on ${input.channel} — only one request is allowed.`,
      );
    }
    throw new Error(`Failed to record consent request: ${error.message}`);
  }

  await supabase.from("consent_events").insert({
    organisation_id: organisationId,
    consent_request_id: consentRequest.id,
    event_type: "requested",
    wording_version: input.wordingVersion,
    actor_user_id: actorUserId,
  });

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "consent_request",
    entityId: consentRequest.id,
    action: "consent_requested",
    metadata: { channel: input.channel },
  });

  return consentRequest;
}

export async function recordConsentResponse(
  organisationId: string,
  consentRequestId: string,
  granted: boolean,
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  const { data: consentRequest, error: fetchError } = await supabase
    .from("consent_requests")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("id", consentRequestId)
    .single();
  if (fetchError || !consentRequest) throw new Error("Consent request not found");

  const status = granted ? "granted" : "declined";
  const { error } = await supabase
    .from("consent_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", consentRequestId);
  if (error) throw new Error(`Failed to record response: ${error.message}`);

  await supabase.from("consent_events").insert({
    organisation_id: organisationId,
    consent_request_id: consentRequestId,
    event_type: status,
    wording_version: consentRequest.wording_version,
    actor_user_id: actorUserId,
  });

  if (!granted) {
    await supabase.from("suppression").insert({
      organisation_id: organisationId,
      company_id: consentRequest.company_id,
      reason: "declined consent",
    });
  }

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "consent_request",
    entityId: consentRequestId,
    action: granted ? "consent_granted" : "consent_declined",
  });
}

/**
 * Withdrawal (section 18): updates consent status, adds suppression, and
 * cancels scheduled communications — all in one command so a UI action
 * can never do only part of this.
 */
export async function withdrawConsent(organisationId: string, consentRequestId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  const { data: consentRequest, error: fetchError } = await supabase
    .from("consent_requests")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("id", consentRequestId)
    .single();
  if (fetchError || !consentRequest) throw new Error("Consent request not found");
  if (consentRequest.status === "withdrawn") return consentRequest;

  const { error } = await supabase
    .from("consent_requests")
    .update({ status: "withdrawn", responded_at: new Date().toISOString() })
    .eq("id", consentRequestId);
  if (error) throw new Error(`Failed to withdraw consent: ${error.message}`);

  await supabase.from("consent_events").insert({
    organisation_id: organisationId,
    consent_request_id: consentRequestId,
    event_type: "withdrawn",
    wording_version: consentRequest.wording_version,
    actor_user_id: actorUserId,
  });

  await supabase.from("suppression").insert({
    organisation_id: organisationId,
    company_id: consentRequest.company_id,
    reason: "withdrew consent",
  });

  const { data: leads } = await supabase
    .from("leads")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("company_id", consentRequest.company_id);

  const leadIds = (leads ?? []).map((l) => l.id);
  if (leadIds.length > 0) {
    await supabase
      .from("followups")
      .update({ completed_at: new Date().toISOString() })
      .in("lead_id", leadIds)
      .is("completed_at", null);
  }

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "consent_request",
    entityId: consentRequestId,
    action: "consent_withdrawn",
  });
}
