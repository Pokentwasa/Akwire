import { describe, expect, it } from "vitest";
import { generateCampaignAssets } from "@/domain/campaigns/asset-generator";
import { webDesignLocalBusinessPack } from "@/opportunity-packs/web-design-local-business";

describe("generateCampaignAssets", () => {
  const assets = generateCampaignAssets(webDesignLocalBusinessPack, {
    angle: "Your physical experience is stronger than your digital one.",
    offer: "Free website opportunity audit.",
  });

  it("generates one asset of each expected type", () => {
    const types = assets.map((a) => a.type);
    expect(types).toEqual(["ad_copy", "lead_form_copy", "landing_page_copy", "campaign_setup_notes"]);
  });

  it("carries the given angle and offer into the ad copy verbatim", () => {
    const adCopy = assets.find((a) => a.type === "ad_copy")!;
    expect(adCopy.content.headline).toBe("Your physical experience is stronger than your digital one.");
    expect(adCopy.content.body).toContain("Free website opportunity audit.");
  });

  it("includes an unreviewed-legal-wording warning on the lead form", () => {
    const leadForm = assets.find((a) => a.type === "lead_form_copy")!;
    expect(String(leadForm.content.consentNote)).toMatch(/legal counsel/i);
  });

  it("lists the pack's decision-makers in the setup notes", () => {
    const notes = assets.find((a) => a.type === "campaign_setup_notes")!;
    expect(notes.content.decisionMakers).toEqual(webDesignLocalBusinessPack.typicalDecisionMakers);
  });
});
