import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityInput = {
  organisationId: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
};

/**
 * Every domain command that changes meaningful state should append an
 * activity row (section 28). Keep this call inside the same transaction-ish
 * unit of work as the mutation it describes wherever the caller can manage
 * it; Postgres RPCs do this atomically, plain client calls do it best-effort.
 */
export async function logActivity(
  supabase: SupabaseClient,
  input: ActivityInput,
) {
  const { error } = await supabase.from("activities").insert({
    organisation_id: input.organisationId,
    actor_user_id: input.actorUserId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Failed to log activity "${input.action}": ${error.message}`);
  }
}
