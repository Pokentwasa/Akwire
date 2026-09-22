import type { OpportunityPack } from "@/opportunity-packs/types";

/**
 * The pilot pack for Poke Digital (docs/OPPORTUNITY_PACKS.md). Evidence
 * fields mirror the Harbour Table example in the product brief (section 9):
 * an established, well-reviewed business with a website that shows real
 * signs of needing a redesign.
 */
export const webDesignLocalBusinessPack: OpportunityPack = {
  id: "web-design-local-business",
  name: "Web Design — Local Business",
  supportedIndustries: [
    "Restaurant",
    "Coffee shop",
    "Boutique hotel",
    "Guest house",
    "Wine estate",
    "Architecture firm",
    "Property",
    "Gym",
    "Beauty / wellness",
    "Charter / aviation",
    "Other",
  ],
  evidenceFields: [
    {
      key: "googleRating",
      label: "Google rating",
      kind: "number",
      helpText: "Out of 5",
    },
    {
      key: "reviewCount",
      label: "Number of reviews",
      kind: "number",
    },
    {
      key: "hasWebsite",
      label: "Has a website",
      kind: "boolean",
    },
    {
      key: "poorMobileExperience",
      label: "Website is not mobile-friendly",
      kind: "boolean",
      gapSignal: true,
      helpText: "Slow, unresponsive, or hard to use on a phone",
    },
    {
      key: "unclearCta",
      label: "No clear call to action",
      kind: "boolean",
      gapSignal: true,
      helpText: "Unclear how a visitor books, orders, or enquires",
    },
    {
      key: "outdatedDesign",
      label: "Design looks outdated",
      kind: "boolean",
      gapSignal: true,
    },
    {
      key: "noBookingOrEnquiryPath",
      label: "No online booking / enquiry path",
      kind: "boolean",
      gapSignal: true,
    },
    {
      key: "weakSeoStructure",
      label: "Weak local SEO structure",
      kind: "boolean",
      gapSignal: true,
      helpText: "Missing titles/meta, no local landing pages, thin content",
    },
  ],
  scoringWeights: {
    icpFit: 0.25,
    businessQuality: 0.3,
    serviceGap: 0.4,
    timing: 0.05,
  },
  recommendedService: "Website redesign",
  typicalDecisionMakers: ["Owner", "Founder", "Marketing Manager", "General Manager"],
};

export const OPPORTUNITY_PACKS = {
  [webDesignLocalBusinessPack.id]: webDesignLocalBusinessPack,
};

export type OpportunityPackId = keyof typeof OPPORTUNITY_PACKS;
