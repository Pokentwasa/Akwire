import { describe, expect, it } from "vitest";
import { publicLeadSubmissionInput, recordLeadInput } from "@/domain/leads/schema";

describe("publicLeadSubmissionInput", () => {
  it("requires a business name, a name, and a valid email", () => {
    expect(
      publicLeadSubmissionInput.safeParse({ businessName: "", name: "", email: "not-an-email" })
        .success,
    ).toBe(false);
  });

  it("accepts a minimal valid submission", () => {
    const result = publicLeadSubmissionInput.safeParse({
      businessName: "Harbour Table",
      name: "Jane Doe",
      email: "jane@harbourtable.example",
    });
    expect(result.success).toBe(true);
  });
});

describe("recordLeadInput", () => {
  it("defaults source to manual", () => {
    const result = recordLeadInput.parse({});
    expect(result.source).toBe("manual");
  });
});
