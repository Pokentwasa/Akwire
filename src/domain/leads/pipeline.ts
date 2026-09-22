export type LeadStatus =
  | "new"
  | "qualified"
  | "consent_requested"
  | "consented"
  | "pitch_ready"
  | "pitch_sent"
  | "replied"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "declined"
  | "no_response"
  | "suppressed";

/**
 * State transitions are commands, not free-form UPDATEs (section 28/49):
 * "Invalid stage transitions are rejected." Won/lost/declined/suppressed
 * are terminal — nothing leaves them. Every other edge here is one a
 * command in src/domain/leads actually performs; this table is the single
 * source of truth for what's allowed, so the UI can't do anything the
 * domain layer wouldn't.
 */
const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ["qualified", "consent_requested", "declined", "suppressed"],
  qualified: ["pitch_ready", "consent_requested", "declined"],
  consent_requested: ["consented", "declined", "no_response", "suppressed"],
  consented: ["qualified", "pitch_ready"],
  pitch_ready: ["pitch_sent"],
  pitch_sent: ["replied", "meeting", "no_response", "lost"],
  replied: ["meeting", "proposal", "lost"],
  meeting: ["proposal", "negotiation", "lost"],
  proposal: ["negotiation", "won", "lost"],
  negotiation: ["won", "lost"],
  won: [],
  lost: [],
  declined: [],
  no_response: ["pitch_sent", "lost"],
  suppressed: [],
};

export class InvalidLeadTransitionError extends Error {
  constructor(from: LeadStatus, to: LeadStatus) {
    super(`Cannot move a lead from "${from}" to "${to}"`);
    this.name = "InvalidLeadTransitionError";
  }
}

export function assertValidTransition(from: LeadStatus, to: LeadStatus) {
  if (from === to) return;
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidLeadTransitionError(from, to);
  }
}
