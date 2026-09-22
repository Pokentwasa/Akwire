import { z } from "zod";

export const createOrganisationInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only")
    .min(2)
    .max(60),
});
export type CreateOrganisationInput = z.infer<typeof createOrganisationInput>;

export const senderProfileInput = z.object({
  businessName: z.string().trim().min(2).max(120),
  website: z.string().trim().url().optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
});
export type SenderProfileInput = z.infer<typeof senderProfileInput>;

export const offeringInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  services: z
    .array(z.string().trim().min(1).max(80))
    .min(1, "Add at least one service or product"),
  typicalCustomerValueCents: z.number().int().nonnegative().optional(),
  currency: z.string().trim().length(3).default("ZAR"),
  isPrimary: z.boolean().default(true),
});
export type OfferingInput = z.infer<typeof offeringInput>;

export const idealCustomerProfileInput = z.object({
  offeringId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  targetIndustries: z.array(z.string().trim().min(1).max(80)).min(1),
  excludedIndustries: z.array(z.string().trim().min(1).max(80)).default([]),
  geography: z.array(z.string().trim().min(1).max(80)).min(1),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  exampleGoodCustomers: z.array(z.string().trim().min(1).max(120)).default([]),
});
export type IdealCustomerProfileInput = z.infer<typeof idealCustomerProfileInput>;
