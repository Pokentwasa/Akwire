"use server";

import { submitPublicLead } from "@/domain/leads/commands";

export async function submitLeadAction(campaignId: string, _prevState: unknown, formData: FormData) {
  try {
    await submitPublicLead(campaignId, {
      businessName: String(formData.get("businessName") ?? ""),
      website: String(formData.get("website") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      improvementArea: String(formData.get("improvementArea") ?? ""),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }

  return { success: true };
}
