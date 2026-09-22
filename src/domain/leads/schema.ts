import { z } from "zod";

export const recordLeadInput = z.object({
  companyId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.string().trim().max(80).optional().or(z.literal("")),
  source: z.enum(["manual", "yebo_form", "csv_import"]).default("manual"),
});
export type RecordLeadInput = z.infer<typeof recordLeadInput>;

export const publicLeadSubmissionInput = z.object({
  businessName: z.string().trim().min(1).max(200),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  improvementArea: z.string().trim().max(80).optional().or(z.literal("")),
});
export type PublicLeadSubmissionInput = z.infer<typeof publicLeadSubmissionInput>;
