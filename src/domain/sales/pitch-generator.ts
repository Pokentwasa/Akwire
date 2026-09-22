/**
 * Deterministic, evidence-grounded pitch email — not AI-generated (no
 * ANTHROPIC_API_KEY configured in this environment; see docs/SETUP.md).
 * Every line in the body traces back to the opportunity's own explanation
 * array, which in turn traces back to collected evidence (section 22:
 * "specific, short, based only on actual evidence"). Swapping in an LLM
 * later means replacing this function's body, not its callers or the
 * pitch schema.
 */
export type PitchInput = {
  companyName: string;
  recommendedService: string;
  explanation: string[];
  offer: string;
  senderBusinessName: string;
};

export type GeneratedPitch = { subject: string; body: string };

export function generatePitchEmail(input: PitchInput): GeneratedPitch {
  const { companyName, recommendedService, explanation, offer, senderBusinessName } = input;

  // Only strip lines the engine marks as "we don't actually know this yet"
  // (see engine.ts's "unconfirmed" wording) — a real finding that happens
  // to start with "No" (e.g. "No clear call to action") is still evidence
  // and must stay in.
  const observations = explanation.filter((line) => !line.toLowerCase().includes("unconfirmed"));

  const subject = `${companyName} — a quick observation about your website`;

  const observationLines =
    observations.length > 0
      ? observations.map((line) => `- ${line}`).join("\n")
      : "- Your website has a few areas worth a closer look.";

  const body = [
    `Hi there,`,
    ``,
    `I took a look at ${companyName}'s website and noticed a few things:`,
    ``,
    observationLines,
    ``,
    `Based on that, ${recommendedService.toLowerCase()} looks like the highest-leverage next step.`,
    ``,
    `${offer}`,
    ``,
    `Worth a quick chat?`,
    ``,
    senderBusinessName,
  ].join("\n");

  return { subject, body };
}
