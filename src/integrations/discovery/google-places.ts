import type { DiscoveryProvider, NormalizedCompany } from "@/integrations/discovery/types";

type PlacesSearchResponse = {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    types?: string[];
  }>;
};

/**
 * Real Google Places (New) Text Search integration — not a stub. It throws
 * a clear configuration error when GOOGLE_PLACES_API_KEY isn't set (this
 * environment doesn't have one; see docs/SETUP.md) rather than returning
 * fake results. Set the key and this starts working with no code changes.
 */
export const googlePlacesProvider: DiscoveryProvider = {
  id: "google-places",
  name: "Google Places",

  async search({ what, where }): Promise<NormalizedCompany[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Google Places isn't configured yet. Set GOOGLE_PLACES_API_KEY (see docs/SETUP.md) to enable this provider — until then, use CSV import or add companies manually.",
      );
    }

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.types",
      },
      body: JSON.stringify({ textQuery: `${what} in ${where}` }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Places search failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as PlacesSearchResponse;

    return (data.places ?? []).map((place) => ({
      name: place.displayName?.text ?? "Unknown business",
      website: place.websiteUri,
      sourceProvider: "google-places",
      sourceExternalId: place.id,
      metadata: {
        formattedAddress: place.formattedAddress,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        types: place.types,
      },
    }));
  },
};
