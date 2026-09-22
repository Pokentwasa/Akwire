import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Static check that the single-consent-request rule (section 18: "only
 * one request may be made through Yebo") is enforced by a database
 * constraint, not just application code — a second insert for the same
 * organisation+company+channel must fail at the database regardless of
 * which code path tries it.
 */
describe("consent_requests single-request constraint", () => {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  const sql = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(migrationsDir, f), "utf8"))
    .join("\n\n");

  it("has a unique index scoping one request per organisation+company+channel", () => {
    const match = sql.match(
      /create unique index \S+\s+on consent_requests \(([^)]+)\)/i,
    );
    expect(match).not.toBeNull();
    const columns = match![1].replace(/\s+/g, "");
    expect(columns).toBe("organisation_id,company_id,channel");
  });
});
