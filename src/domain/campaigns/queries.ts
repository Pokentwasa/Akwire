import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function listCampaigns(organisationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("*, campaign_companies(count)")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load campaigns: ${error.message}`);
  return data;
}

export async function getCampaignWorkspace(organisationId: string, campaignId: string) {
  const supabase = await createClient();

  const [{ data: campaign, error: campaignError }, { data: companies, error: companiesError }, { data: assets, error: assetsError }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("id", campaignId)
        .single(),
      supabase
        .from("campaign_companies")
        .select("status, added_at, companies(id, name, industry, city)")
        .eq("organisation_id", organisationId)
        .eq("campaign_id", campaignId),
      supabase
        .from("campaign_assets")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true }),
    ]);

  if (campaignError) return null;
  if (companiesError) throw new Error(`Failed to load campaign companies: ${companiesError.message}`);
  if (assetsError) throw new Error(`Failed to load campaign assets: ${assetsError.message}`);

  return { campaign, companies: companies ?? [], assets: assets ?? [] };
}
