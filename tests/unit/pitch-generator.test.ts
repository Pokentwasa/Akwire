import { describe, expect, it } from "vitest";
import { generatePitchEmail } from "@/domain/sales/pitch-generator";

describe("generatePitchEmail", () => {
  it("only includes observations actually passed in, never invents evidence", () => {
    const pitch = generatePitchEmail({
      companyName: "Harbour Table",
      recommendedService: "Website redesign",
      explanation: ["Website is not mobile-friendly", "No clear call to action"],
      offer: "Free website opportunity audit.",
      senderBusinessName: "Poke Digital",
    });

    expect(pitch.subject).toContain("Harbour Table");
    expect(pitch.body).toContain("Website is not mobile-friendly");
    expect(pitch.body).toContain("No clear call to action");
    expect(pitch.body).toContain("Free website opportunity audit.");
    expect(pitch.body).toContain("Poke Digital");
    expect(pitch.body).not.toContain("undefined");
  });

  it("filters out unconfirmed/no-evidence lines rather than pitching on them", () => {
    const pitch = generatePitchEmail({
      companyName: "Formline Gym",
      recommendedService: "Website redesign",
      explanation: ["No review data collected yet — business quality is unconfirmed."],
      offer: "Free website opportunity audit.",
      senderBusinessName: "Poke Digital",
    });

    expect(pitch.body).not.toContain("unconfirmed");
    expect(pitch.body).toContain("worth a closer look");
  });
});
