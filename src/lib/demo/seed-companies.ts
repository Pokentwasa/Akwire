import type { EvidenceValues } from "@/domain/opportunities/engine";

export type SeedCompany = {
  name: string;
  industry: string;
  city: string;
  country: string;
  website: string;
  evidence: EvidenceValues;
};

/**
 * Sample companies for /demo — enough variety to show the Opportunity
 * Engine actually discriminating, not just always returning a high score.
 * Harbour Table is the exact example from the product brief (section 9).
 */
export const seedCompanies: SeedCompany[] = [
  {
    name: "Harbour Table",
    industry: "Restaurant",
    city: "Cape Town",
    country: "South Africa",
    website: "https://harbourtable.example",
    evidence: {
      googleRating: 4.6,
      reviewCount: 684,
      hasWebsite: true,
      poorMobileExperience: true,
      unclearCta: true,
      outdatedDesign: false,
      noBookingOrEnquiryPath: true,
      weakSeoStructure: true,
    },
  },
  {
    name: "Steenberg Wine Estate",
    industry: "Wine estate",
    city: "Constantia",
    country: "South Africa",
    website: "https://steenberg.example",
    evidence: {
      googleRating: 4.8,
      reviewCount: 1240,
      hasWebsite: true,
      poorMobileExperience: false,
      unclearCta: false,
      outdatedDesign: false,
      noBookingOrEnquiryPath: false,
      weakSeoStructure: false,
    },
  },
  {
    name: "Longbeach Guest House",
    industry: "Guest house",
    city: "Noordhoek",
    country: "South Africa",
    website: "",
    evidence: {
      hasWebsite: false,
      googleRating: 4.3,
      reviewCount: 58,
    },
  },
  {
    name: "Atlas Architecture Studio",
    industry: "Architecture firm",
    city: "Cape Town",
    country: "South Africa",
    website: "https://atlas-studio.example",
    evidence: {
      googleRating: 3.9,
      reviewCount: 14,
      hasWebsite: true,
      poorMobileExperience: true,
      unclearCta: true,
      outdatedDesign: true,
      weakSeoStructure: true,
    },
  },
  {
    name: "Formline Gym",
    industry: "Gym",
    city: "Sea Point",
    country: "South Africa",
    website: "https://formlinegym.example",
    evidence: {
      hasWebsite: true,
    },
  },
];
