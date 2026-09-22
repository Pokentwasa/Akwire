import type { OpportunityPack } from "@/opportunity-packs/types";

export type CampaignAsset = { type: string; content: Record<string, unknown> };

/**
 * Deterministic, template-based campaign copy from the Opportunity Pack's
 * own angles/offers — not AI-generated (no ANTHROPIC_API_KEY configured in
 * this environment; see docs/SETUP.md). Swapping in an LLM later means
 * replacing this function's body, not the callers or the schema.
 *
 * Per section 16: Yebo prepares campaign material, it does not deploy
 * advertising automatically.
 */
export function generateCampaignAssets(
  pack: OpportunityPack,
  params: { angle: string; offer: string },
): CampaignAsset[] {
  const { angle, offer } = params;
  const industries = pack.supportedIndustries.filter((i) => i !== "Other");

  return [
    {
      type: "ad_copy",
      content: {
        headline: angle,
        body: `${offer} Built for ${industries.slice(0, 3).join(", ")} businesses whose website isn't pulling its weight.`,
        cta: "Get my free audit",
      },
    },
    {
      type: "lead_form_copy",
      content: {
        title: `${pack.recommendedService} opportunity audit`,
        fields: [
          { label: "Business name", type: "text", required: true },
          { label: "Website", type: "url", required: false },
          { label: "Name", type: "text", required: true },
          { label: "Email", type: "email", required: true },
          {
            label: "What would you most like to improve?",
            type: "select",
            options: ["Website", "Google visibility", "Lead generation", "Online bookings", "Not sure"],
            required: true,
          },
        ],
        consentNote:
          "Consent/privacy wording placeholder — must be reviewed by South African legal counsel before use (see docs/LEGAL_REVIEW.md).",
      },
    },
    {
      type: "landing_page_copy",
      content: {
        headline: angle,
        subheadline: offer,
        body: `We looked at what ${industries[0]?.toLowerCase() ?? "local"} businesses like yours are up against online, and built this audit to show you exactly where you're losing customers before they ever call.`,
        cta: "Claim your free audit",
      },
    },
    {
      type: "campaign_setup_notes",
      content: {
        decisionMakers: pack.typicalDecisionMakers,
        note: "LinkedIn: prepare an account-based export for these decision-maker roles (manual setup — Yebo doesn't deploy campaigns automatically, section 16). Meta: use this copy as creative with ICP-based targeting rather than a company-list upload.",
      },
    },
  ];
}
