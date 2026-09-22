import "server-only";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function listLeads(organisationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*, companies(name), campaigns(name)")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load leads: ${error.message}`);
  return data;
}

/**
 * Read for the public lead-capture page — there's no signed-in user, so
 * the normal RLS-scoped client would (correctly) return nothing. Uses the
 * service-role client and only ever returns the few fields a landing page
 * needs, scoped to one campaign id (effectively an unguessable capability
 * token); never used to list or enumerate campaigns.
 */
export async function getCampaignForPublicForm(campaignId: string) {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("campaigns")
      .select("id, name, angle, offer")
      .eq("id", campaignId)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    // No live Supabase project configured (see docs/SETUP.md) — degrade to
    // "not found" rather than 500ing a public page.
    return null;
  }
}
