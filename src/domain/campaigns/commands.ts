import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import { createCampaignInput, type CreateCampaignInput } from "@/domain/campaigns/schema";
import { generateCampaignAssets } from "@/domain/campaigns/asset-generator";
import { OPPORTUNITY_PACKS } from "@/opportunity-packs/web-design-local-business";

export async function createCampaign(organisationId: string, raw: CreateCampaignInput) {
  const input = createCampaignInput.parse(raw);
  const pack = OPPORTUNITY_PACKS["web-design-local-business"];

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const actorUserId = userData.user?.id ?? null;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      organisation_id: organisationId,
      name: input.name,
      pack_id: pack.id,
      route: input.route,
      angle: input.angle,
      offer: input.offer,
      status: "draft",
      created_by: actorUserId,
    })
    .select()
    .single();

  if (campaignError) throw new Error(`Failed to create campaign: ${campaignError.message}`);

  const { error: companiesError } = await supabase.from("campaign_companies").insert(
    input.companyIds.map((companyId) => ({
      organisation_id: organisationId,
      campaign_id: campaign.id,
      company_id: companyId,
    })),
  );
  if (companiesError) throw new Error(`Failed to target companies: ${companiesError.message}`);

  const assets = generateCampaignAssets(pack, { angle: input.angle, offer: input.offer });
  const { error: assetsError } = await supabase.from("campaign_assets").insert(
    assets.map((asset) => ({
      organisation_id: organisationId,
      campaign_id: campaign.id,
      type: asset.type,
      content: asset.content,
    })),
  );
  if (assetsError) throw new Error(`Failed to generate campaign assets: ${assetsError.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId,
    entityType: "campaign",
    entityId: campaign.id,
    action: "campaign_created",
    metadata: { companyCount: input.companyIds.length },
  });

  return campaign;
}
