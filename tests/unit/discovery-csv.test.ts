import { describe, expect, it } from "vitest";
import { CsvImportError, parseCompaniesCsv } from "@/integrations/discovery/csv";

describe("parseCompaniesCsv", () => {
  it("parses a well-formed CSV with all known columns", () => {
    const csv = [
      "name,industry,city,region,country,website",
      "Harbour Table,Restaurant,Cape Town,Western Cape,South Africa,https://harbourtable.example",
      "Steenberg,Wine estate,Constantia,,South Africa,",
    ].join("\n");

    const result = parseCompaniesCsv(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: "Harbour Table",
      industry: "Restaurant",
      city: "Cape Town",
      website: "https://harbourtable.example",
      sourceProvider: "csv",
    });
    expect(result[1].website).toBeUndefined();
  });

  it("handles quoted fields containing commas", () => {
    const csv = ['name,city', '"Harbour Table, Waterfront",Cape Town'].join("\n");
    const result = parseCompaniesCsv(csv);
    expect(result[0].name).toBe("Harbour Table, Waterfront");
  });

  it("skips rows with no name", () => {
    const csv = ["name,city", ",Cape Town", "Harbour Table,Cape Town"].join("\n");
    const result = parseCompaniesCsv(csv);
    expect(result).toHaveLength(1);
  });

  it("rejects a CSV with no name column", () => {
    const csv = ["city,website", "Cape Town,https://example.com"].join("\n");
    expect(() => parseCompaniesCsv(csv)).toThrow(CsvImportError);
  });

  it("rejects an empty file", () => {
    expect(() => parseCompaniesCsv("")).toThrow(CsvImportError);
  });

  it("rejects a CSV with only a header row", () => {
    expect(() => parseCompaniesCsv("name,city")).toThrow(CsvImportError);
  });
});
