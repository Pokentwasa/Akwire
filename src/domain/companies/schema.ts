import { z } from "zod";

export const createCompanyInput = z.object({
  name: z.string().trim().min(2).max(200),
  industry: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  packId: z.string().trim().min(1),
  offeringId: z.string().uuid().optional(),
  evidence: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});
export type CreateCompanyInput = z.infer<typeof createCompanyInput>;

export const companyStatusValues = ["new", "shortlisted", "researched", "rejected"] as const;
export type CompanyStatus = (typeof companyStatusValues)[number];
