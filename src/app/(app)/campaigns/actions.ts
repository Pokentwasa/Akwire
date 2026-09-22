"use server";

import { redirect } from "next/navigation";
import { createCampaign } from "@/domain/campaigns/commands";
import { getCurrentOrganisation } from "@/domain/organisations/queries";

export async function createCampaignAction(_prevState: unknown, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  const companyIds = formData.getAll("companyIds").map(String);

  let campaignId: string;
  try {
    const campaign = await createCampaign(org.id, {
      name: String(formData.get("name") ?? ""),
      companyIds,
      angle: String(formData.get("angle") ?? ""),
      offer: String(formData.get("offer") ?? ""),
      route: "audience",
    });
    campaignId = campaign.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }

  redirect(`/campaigns/${campaignId}`);
}
