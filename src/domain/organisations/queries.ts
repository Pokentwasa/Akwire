import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * V1 assumption: a user belongs to exactly one organisation (created during
 * onboarding). Multi-org membership can be added later without touching the
 * RLS model — `memberships` already supports it.
 */
export async function getCurrentOrganisation() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("memberships")
    .select("organisation_id, role, organisations(id, name, slug)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return data.organisations as unknown as { id: string; name: string; slug: string };
}
