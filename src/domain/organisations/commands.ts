import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/domain/shared/activity";
import {
  createOrganisationInput,
  idealCustomerProfileInput,
  offeringInput,
  senderProfileInput,
  type CreateOrganisationInput,
  type IdealCustomerProfileInput,
  type OfferingInput,
  type SenderProfileInput,
} from "@/domain/organisations/schema";

/**
 * Domain commands are the only sanctioned way to mutate these tables from
 * the app (section 28). They validate input, call the RLS-scoped Postgres
 * functions/tables, and record an Activity. No route or component should
 * write to these tables directly.
 */

export async function createOrganisation(raw: CreateOrganisationInput) {
  const input = createOrganisationInput.parse(raw);
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("create_organisation", { org_name: input.name, org_slug: input.slug })
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That organisation URL is already taken. Try another.");
    }
    throw new Error(`Failed to create organisation: ${error.message}`);
  }

  return data as { id: string; name: string; slug: string };
}

export async function saveSenderProfile(organisationId: string, raw: SenderProfileInput) {
  const input = senderProfileInput.parse(raw);
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("sender_profiles").upsert({
    organisation_id: organisationId,
    business_name: input.businessName,
    website: input.website || null,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
  });

  if (error) throw new Error(`Failed to save sender profile: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "organisation",
    entityId: organisationId,
    action: "sender_profile_saved",
  });
}

export async function saveOffering(organisationId: string, raw: OfferingInput) {
  const input = offeringInput.parse(raw);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("offerings")
    .insert({
      organisation_id: organisationId,
      name: input.name,
      description: input.description || null,
      services: input.services,
      typical_customer_value_cents: input.typicalCustomerValueCents ?? null,
      currency: input.currency,
      is_primary: input.isPrimary,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save offering: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "offering",
    entityId: data.id,
    action: "offering_created",
  });

  return data;
}

export async function saveIdealCustomerProfile(
  organisationId: string,
  raw: IdealCustomerProfileInput,
) {
  const input = idealCustomerProfileInput.parse(raw);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("ideal_customer_profiles")
    .insert({
      organisation_id: organisationId,
      offering_id: input.offeringId ?? null,
      name: input.name,
      target_industries: input.targetIndustries,
      excluded_industries: input.excludedIndustries,
      geography: input.geography,
      description: input.description || null,
      example_good_customers: input.exampleGoodCustomers,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save ideal customer profile: ${error.message}`);

  await logActivity(supabase, {
    organisationId,
    actorUserId: userData.user?.id ?? null,
    entityType: "ideal_customer_profile",
    entityId: data.id,
    action: "icp_created",
  });

  return data;
}
