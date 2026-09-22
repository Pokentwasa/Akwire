import { z } from "zod";

export const requestConsentInput = z.object({
  companyId: z.string().uuid(),
  channel: z.enum(["email", "phone", "sms"]),
  scope: z.string().trim().min(1).max(500),
  wordingVersion: z.string().trim().min(1).max(40),
});
export type RequestConsentInput = z.infer<typeof requestConsentInput>;
