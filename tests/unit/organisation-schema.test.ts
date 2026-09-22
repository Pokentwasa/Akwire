import { describe, expect, it } from "vitest";
import {
  createOrganisationInput,
  idealCustomerProfileInput,
  offeringInput,
} from "@/domain/organisations/schema";

describe("organisation domain schemas", () => {
  it("rejects an organisation slug with invalid characters", () => {
    const result = createOrganisationInput.safeParse({
      name: "Poke Digital",
      slug: "Poke Digital!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid organisation", () => {
    const result = createOrganisationInput.safeParse({
      name: "Poke Digital",
      slug: "poke-digital",
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one service on an offering", () => {
    const result = offeringInput.safeParse({
      name: "Website design",
      services: [],
      currency: "ZAR",
      isPrimary: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires at least one target industry and one geography on an ICP", () => {
    const result = idealCustomerProfileInput.safeParse({
      name: "Primary ICP",
      targetIndustries: [],
      excludedIndustries: [],
      geography: [],
      exampleGoodCustomers: [],
    });
    expect(result.success).toBe(false);
  });
});
