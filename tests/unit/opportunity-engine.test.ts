import { describe, expect, it } from "vitest";
import { scoreOpportunity } from "@/domain/opportunities/engine";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";

describe("scoreOpportunity", () => {
  it("scores a strong opportunity high with high confidence (Harbour Table case)", () => {
    const result = scoreOpportunity(webDesignLocalBusinessPack, "Restaurant", {
      googleRating: 4.6,
      reviewCount: 684,
      hasWebsite: true,
      poorMobileExperience: true,
      unclearCta: true,
      outdatedDesign: true,
      noBookingOrEnquiryPath: true,
      weakSeoStructure: true,
    });

    expect(result.opportunityScore).toBeGreaterThanOrEqual(70);
    expect(result.confidence).toBe("high");
    expect(result.icpFit).toBeGreaterThan(80);
    expect(result.businessQuality).toBeGreaterThan(80);
    expect(result.serviceGap).toBe(100);
    expect(result.recommendedAction).toBe("Add to campaign.");
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("does not invent evidence for fields that were never collected", () => {
    const result = scoreOpportunity(webDesignLocalBusinessPack, null, {});

    expect(result.confidence).toBe("low");
    expect(result.icpFit).toBe(40);
    expect(result.businessQuality).toBe(40);
    expect(result.serviceGap).toBe(50);
    expect(result.recommendedAction).toBe("Collect more evidence before acting.");
  });

  it("flags a company with no website as maximum service gap", () => {
    const result = scoreOpportunity(webDesignLocalBusinessPack, "Restaurant", {
      hasWebsite: false,
    });

    expect(result.serviceGap).toBe(95);
    expect(result.explanation).toContain("Company has no website at all.");
  });

  it("is not artificially low-confidence for a fully-answered no-website case", () => {
    // The five website-flaw fields are moot once we know there's no website
    // at all — they should never have been asked, so they must not drag
    // confidence down. Regression test for a real bug: this case used to
    // render a bold "high opportunity" score next to "low confidence" and
    // "collect more evidence", which contradicted itself.
    const result = scoreOpportunity(webDesignLocalBusinessPack, "Guest house", {
      hasWebsite: false,
      googleRating: 4.3,
      reviewCount: 58,
    });

    expect(result.confidence).toBe("high");
    expect(result.recommendedAction).not.toBe("Collect more evidence before acting.");
  });

  it("scores a genuinely good website low on service gap", () => {
    const result = scoreOpportunity(webDesignLocalBusinessPack, "Restaurant", {
      googleRating: 4.8,
      reviewCount: 900,
      hasWebsite: true,
      poorMobileExperience: false,
      unclearCta: false,
      outdatedDesign: false,
      noBookingOrEnquiryPath: false,
      weakSeoStructure: false,
    });

    expect(result.serviceGap).toBe(0);
    expect(result.opportunityScore).toBeLessThan(60);
  });

  it("never returns a score outside 0-100", () => {
    const result = scoreOpportunity(webDesignLocalBusinessPack, "Something unlisted", {
      googleRating: 5,
      reviewCount: 10000,
    });

    for (const value of [
      result.icpFit,
      result.businessQuality,
      result.serviceGap,
      result.timingScore,
      result.opportunityScore,
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
