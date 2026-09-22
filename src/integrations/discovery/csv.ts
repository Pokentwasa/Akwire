import type { NormalizedCompany } from "@/integrations/discovery/types";

/**
 * Minimal quote-aware CSV parser (no external dependency). Expects a header
 * row with at least a "name" column; recognises name, industry, city,
 * region, country, website — anything else is ignored.
 */
function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }

  return rows;
}

const KNOWN_COLUMNS = ["name", "industry", "city", "region", "country", "website"] as const;

export class CsvImportError extends Error {}

export function parseCompaniesCsv(content: string): NormalizedCompany[] {
  const rows = parseCsvRows(content.trim());
  if (rows.length === 0) throw new CsvImportError("The CSV file is empty");

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIndex = header.indexOf("name");
  if (nameIndex === -1) {
    throw new CsvImportError('CSV must have a "name" column');
  }

  const columnIndex: Partial<Record<(typeof KNOWN_COLUMNS)[number], number>> = {};
  for (const col of KNOWN_COLUMNS) {
    const idx = header.indexOf(col);
    if (idx !== -1) columnIndex[col] = idx;
  }

  const companies: NormalizedCompany[] = [];
  for (const row of rows.slice(1)) {
    const name = row[nameIndex]?.trim();
    if (!name) continue;

    companies.push({
      name,
      industry: columnIndex.industry !== undefined ? row[columnIndex.industry]?.trim() || undefined : undefined,
      city: columnIndex.city !== undefined ? row[columnIndex.city]?.trim() || undefined : undefined,
      region: columnIndex.region !== undefined ? row[columnIndex.region]?.trim() || undefined : undefined,
      country: columnIndex.country !== undefined ? row[columnIndex.country]?.trim() || undefined : undefined,
      website: columnIndex.website !== undefined ? row[columnIndex.website]?.trim() || undefined : undefined,
      sourceProvider: "csv",
    });
  }

  if (companies.length === 0) {
    throw new CsvImportError("No valid rows found — every row needs a name");
  }

  return companies;
}
