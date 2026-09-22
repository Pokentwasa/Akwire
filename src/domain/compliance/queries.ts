import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function listConsentRequests(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consent_requests")
    .select("*, companies(name)")
    .eq("organisation_id", organisationId)
    .order("requested_at", { ascending: false });

  if (error) throw new Error(`Failed to load consent requests: ${error.message}`);
  return data;
}

export async function listSuppression(organisationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppression")
    .select("*, companies(name)")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load suppression list: ${error.message}`);
  return data;
}
