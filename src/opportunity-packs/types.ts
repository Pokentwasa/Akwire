/**
 * Contract every Opportunity Pack implements (docs/OPPORTUNITY_PACKS.md).
 * The scoring engine (src/domain/opportunities/engine.ts) only ever talks to
 * this interface — adding a new pack must never require touching the engine.
 */

export type EvidenceFieldKind = "boolean" | "number" | "select";

export type EvidenceField = {
  key: string;
  label: string;
  kind: EvidenceFieldKind;
  /** For "select" fields. */
  options?: { value: string; label: string }[];
  /**
   * For "boolean" fields that represent an observed problem: true means
   * evidence *of* the gap (e.g. "site is not mobile-friendly"). Used to
   * compute service_gap and to phrase the explanation.
   */
  gapSignal?: boolean;
  helpText?: string;
};

export type OpportunityPack = {
  id: string;
  name: string;
  supportedIndustries: string[];
  evidenceFields: EvidenceField[];
  scoringWeights: {
    icpFit: number;
    businessQuality: number;
    serviceGap: number;
    timing: number;
  };
  recommendedService: string;
  typicalDecisionMakers: string[];
  campaignAngles: string[];
  offers: string[];
};
