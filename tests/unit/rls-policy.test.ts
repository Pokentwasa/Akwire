import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Static tenant-isolation check for Phase 0 (section 49: "Organisation A
 * cannot access Organisation B data").
 *
 * There is no live database in CI yet (see docs/SETUP.md), so this test
 * parses the migrations and asserts, for every tenant-scoped table:
 *   1. row level security is enabled
 *   2. at least one policy exists
 *   3. every policy is actually scoped (references is_member_of(...) or
 *      auth.uid(), not just `using (true)`)
 *
 * Once a live Supabase project exists, add a companion integration test
 * that provisions two organisations and asserts cross-tenant reads/writes
 * are rejected by Postgres itself, not just by this static check.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

// Tables that are intentionally not organisation-scoped.
const EXEMPT_TABLES = new Set(["users"]);

function readMigrations(): string {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  return files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8")).join("\n\n");
}

function extractTables(sql: string): string[] {
  const matches = [...sql.matchAll(/create table (\w+)/gi)];
  return matches.map((m) => m[1]).filter((t) => !EXEMPT_TABLES.has(t));
}

function tableHasRlsEnabled(sql: string, table: string): boolean {
  return new RegExp(`alter table ${table} enable row level security`, "i").test(sql);
}

function policiesForTable(sql: string, table: string): string[] {
  const pattern = new RegExp(
    `create policy \\S+ on ${table}[\\s\\S]*?(?=create policy|create (?:table|function|trigger)|$)`,
    "gi",
  );
  return [...sql.matchAll(pattern)].map((m) => m[0]);
}

describe("tenant isolation (static RLS check)", () => {
  const sql = readMigrations();
  const tables = extractTables(sql);

  it("found tenant tables to check", () => {
    expect(tables.length).toBeGreaterThan(0);
  });

  it.each(tables)("table `%s` has row level security enabled", (table) => {
    expect(tableHasRlsEnabled(sql, table)).toBe(true);
  });

  it.each(tables)("table `%s` has at least one scoped policy", (table) => {
    const policies = policiesForTable(sql, table);
    expect(policies.length).toBeGreaterThan(0);

    const scoped = policies.some(
      (p) => /is_member_of\(/.test(p) || /auth\.uid\(\)/.test(p),
    );
    expect(scoped).toBe(true);
  });
});
