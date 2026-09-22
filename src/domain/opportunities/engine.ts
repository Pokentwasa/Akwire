import type { OpportunityPack } from "@/opportunity-packs/types";

export type EvidenceValues = Record<string, string | number | boolean | null | undefined>;

export type ScoredOpportunity = {
  icpFit: number;
  businessQuality: number;
  serviceGap: number;
  timingScore: number;
  opportunityScore: number;
  confidence: "low" | "medium" | "high";
  explanation: string[];
  recommendedService: string;
  recommendedAction: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function isDefined(value: unknown): value is string | number | boolean {
  return value !== null && value !== undefined;
}

function scoreIcpFit(pack: OpportunityPack, industry: string | null, explanation: string[]) {
  if (!industry) {
    explanation.push("No industry specified for this company — ICP fit is unconfirmed.");
    return 40;
  }
  if (pack.supportedIndustries.includes(industry)) {
    explanation.push(`Industry ("${industry}") matches this pack's target industries.`);
    return 90;
  }
  explanation.push(`Industry ("${industry}") is outside this pack's usual target list.`);
  return 55;
}

function scoreBusinessQuality(evidence: EvidenceValues, explanation: string[]) {
  const rating = evidence.googleRating;
  const reviews = evidence.reviewCount;

  if (typeof rating !== "number" || typeof reviews !== "number") {
    explanation.push("No review data collected yet — business quality is unconfirmed.");
    return 40;
  }

  let score = clamp((rating / 5) * 100);
  if (reviews >= 500) score += 10;
  else if (reviews >= 100) score += 5;
  else if (reviews < 20) score -= 15;
  score = clamp(score);

  explanation.push(
    `Google rating ${rating} across ${reviews} reviews suggests ${
      score >= 70 ? "an established, reputable business" : "a newer or less-reviewed business"
    }.`,
  );

  return Math.round(score);
}

function scoreServiceGap(pack: OpportunityPack, evidence: EvidenceValues, explanation: string[]) {
  if (evidence.hasWebsite === false) {
    explanation.push("Company has no website at all.");
    return 95;
  }

  const gapFields = pack.evidenceFields.filter((f) => f.gapSignal);
  const presentGapFields = gapFields.filter((f) => isDefined(evidence[f.key]));

  if (presentGapFields.length === 0) {
    explanation.push("No website evidence collected yet — service gap is unconfirmed.");
    return 50;
  }

  const trueFields = presentGapFields.filter((f) => evidence[f.key] === true);
  trueFields.forEach((f) => explanation.push(f.label));

  if (trueFields.length === 0) {
    explanation.push("No website issues observed in the evidence collected so far.");
  }

  return Math.round((trueFields.length / presentGapFields.length) * 100);
}

function scoreConfidence(pack: OpportunityPack, evidence: EvidenceValues): ScoredOpportunity["confidence"] {
  const total = pack.evidenceFields.length;
  const defined = pack.evidenceFields.filter((f) => isDefined(evidence[f.key])).length;
  const ratio = total === 0 ? 0 : defined / total;

  if (ratio >= 0.7) return "high";
  if (ratio >= 0.4) return "medium";
  return "low";
}

function recommendAction(score: number, confidence: ScoredOpportunity["confidence"]) {
  if (confidence === "low") return "Collect more evidence before acting.";
  if (score >= 70) return "Add to campaign.";
  if (score >= 45) return "Worth a closer look — research further.";
  return "Likely not a fit right now.";
}

export function scoreOpportunity(
  pack: OpportunityPack,
  industry: string | null,
  evidence: EvidenceValues,
): ScoredOpportunity {
  const explanation: string[] = [];

  const icpFit = scoreIcpFit(pack, industry, explanation);
  const businessQuality = scoreBusinessQuality(evidence, explanation);
  const serviceGap = scoreServiceGap(pack, evidence, explanation);
  const timingScore = 50; // No timing signals in this pack yet (docs/SCORING.md).

  const opportunityScore = Math.round(
    pack.scoringWeights.icpFit * icpFit +
      pack.scoringWeights.businessQuality * businessQuality +
      pack.scoringWeights.serviceGap * serviceGap +
      pack.scoringWeights.timing * timingScore,
  );

  const confidence = scoreConfidence(pack, evidence);

  return {
    icpFit,
    businessQuality,
    serviceGap,
    timingScore,
    opportunityScore: clamp(opportunityScore),
    confidence,
    explanation,
    recommendedService: pack.recommendedService,
    recommendedAction: recommendAction(opportunityScore, confidence),
  };
}
