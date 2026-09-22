"use server";

import { revalidatePath } from "next/cache";
import { getCurrentOrganisation } from "@/domain/organisations/queries";
import {
  generatePitch,
  markLost,
  markMeetingBooked,
  markPitchSent,
  markProposalSent,
  markWon,
  scheduleFollowup,
} from "@/domain/sales/commands";

type ActionState = { error?: string } | undefined;

function revalidateLead(leadId: string) {
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/today");
}

export async function generatePitchAction(_prevState: ActionState, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };
  const leadId = String(formData.get("leadId") ?? "");

  try {
    await generatePitch(org.id, leadId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to generate pitch" };
  }
  revalidateLead(leadId);
  return { error: undefined };
}

export async function markPitchSentAction(_prevState: ActionState, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };
  const pitchId = String(formData.get("pitchId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");

  try {
    await markPitchSent(org.id, pitchId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to mark pitch sent" };
  }
  revalidateLead(leadId);
  return { error: undefined };
}

export async function scheduleFollowupAction(_prevState: ActionState, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };
  const leadId = String(formData.get("leadId") ?? "");
  const dueAt = String(formData.get("dueAt") ?? "");
  if (!dueAt) return { error: "Pick a follow-up date" };

  try {
    await scheduleFollowup(org.id, leadId, new Date(dueAt).toISOString(), String(formData.get("note") ?? ""));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to schedule follow-up" };
  }
  revalidateLead(leadId);
  return { error: undefined };
}

export async function markMeetingAction(_prevState: ActionState, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };
  const leadId = String(formData.get("leadId") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  if (!scheduledAt) return { error: "Pick a meeting date" };

  try {
    await markMeetingBooked(
      org.id,
      leadId,
      new Date(scheduledAt).toISOString(),
      String(formData.get("notes") ?? ""),
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to log the meeting" };
  }
  revalidateLead(leadId);
  return { error: undefined };
}

export async function markProposalAction(_prevState: ActionState, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };
  const leadId = String(formData.get("leadId") ?? "");
  const title = String(formData.get("title") ?? "Proposal");

  try {
    await markProposalSent(org.id, leadId, title);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to log the proposal" };
  }
  revalidateLead(leadId);
  return { error: undefined };
}

export async function markWonAction(_prevState: ActionState, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };
  const leadId = String(formData.get("leadId") ?? "");
  const rawValue = String(formData.get("valueCents") ?? "");
  const valueCents = rawValue ? Math.round(Number(rawValue) * 100) : null;

  try {
    await markWon(org.id, leadId, valueCents);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to mark this won" };
  }
  revalidateLead(leadId);
  return { error: undefined };
}

export async function markLostAction(_prevState: ActionState, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };
  const leadId = String(formData.get("leadId") ?? "");

  try {
    await markLost(org.id, leadId, String(formData.get("reason") ?? ""));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to mark this lost" };
  }
  revalidateLead(leadId);
  return { error: undefined };
}
