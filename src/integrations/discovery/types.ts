/**
 * Every discovery source (Google Places, CSV import, a future
 * enrichment/CRM provider) implements this interface and returns
 * normalized records. The Company domain model never talks to a vendor
 * SDK directly (section 8/30 of the brief) — provider-specific IDs live in
 * `company_sources`, not on `companies` itself.
 */
export type NormalizedCompany = {
  name: string;
  industry?: string;
  city?: string;
  region?: string;
  country?: string;
  website?: string;
  sourceProvider: string;
  sourceExternalId?: string;
  sourceUrl?: string;
  /** Provider-specific extras (rating, review count, address, …). */
  metadata?: Record<string, unknown>;
};

export type DiscoveryQuery = {
  what: string;
  where: string;
};

export interface DiscoveryProvider {
  id: string;
  name: string;
  search(query: DiscoveryQuery): Promise<NormalizedCompany[]>;
}
