import type { ScoredOpportunity } from "@/domain/opportunities/engine";

/**
 * A high score with low confidence is not a strong lead — it's a guess.
 * Never render it in "go" green; that's the exact contradiction this
 * function exists to prevent (a number the UI itself doesn't believe yet).
 */
export function scoreColor(score: number, confidence: ScoredOpportunity["confidence"]) {
  if (confidence === "low") return "text-ink-muted";
  if (score >= 70) return "text-success";
  if (score >= 45) return "text-warning";
  return "text-ink-muted";
}
