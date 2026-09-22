import { describe, expect, it } from "vitest";
import { requestConsentInput } from "@/domain/compliance/schema";

describe("requestConsentInput", () => {
  it("requires a valid company id and channel", () => {
    const result = requestConsentInput.safeParse({
      companyId: "not-a-uuid",
      channel: "carrier-pigeon",
      scope: "Website redesign",
      wordingVersion: "v1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed request", () => {
    const result = requestConsentInput.safeParse({
      companyId: "123e4567-e89b-12d3-a456-426614174000",
      channel: "email",
      scope: "Website redesign",
      wordingVersion: "draft-v0-unreviewed",
    });
    expect(result.success).toBe(true);
  });
});
