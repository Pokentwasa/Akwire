"use server";

import { redirect } from "next/navigation";
import { createOrganisation, saveIdealCustomerProfile, saveOffering, saveSenderProfile } from "@/domain/organisations/commands";
import { getCurrentOrganisation } from "@/domain/organisations/queries";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function createOrganisationAction(_prevState: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  try {
    await createOrganisation({ name, slug: slugify(name) });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
  redirect("/onboarding/offering");
}

export async function saveOfferingAction(_prevState: unknown, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  const services = String(formData.get("services") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    await saveOffering(org.id, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      services,
      currency: "ZAR",
      isPrimary: true,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
  redirect("/onboarding/icp");
}

export async function saveIcpAction(_prevState: unknown, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  const targetIndustries = String(formData.get("targetIndustries") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const geography = String(formData.get("geography") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    await saveIdealCustomerProfile(org.id, {
      name: "Primary ICP",
      targetIndustries,
      excludedIndustries: [],
      geography,
      description: String(formData.get("description") ?? ""),
      exampleGoodCustomers: [],
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
  redirect("/onboarding/profile");
}

export async function saveProfileAction(_prevState: unknown, formData: FormData) {
  const org = await getCurrentOrganisation();
  if (!org) return { error: "Create your organisation first" };

  try {
    await saveSenderProfile(org.id, {
      businessName: String(formData.get("businessName") ?? ""),
      website: String(formData.get("website") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
  redirect("/today");
}
