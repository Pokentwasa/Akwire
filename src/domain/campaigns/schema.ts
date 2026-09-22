import { z } from "zod";

export const createCampaignInput = z.object({
  name: z.string().trim().min(2).max(120),
  companyIds: z.array(z.string().uuid()).min(1, "Select at least one company"),
  angle: z.string().trim().min(1).max(200),
  offer: z.string().trim().min(1).max(200),
  route: z.enum(["audience", "direct"]).default("audience"),
});
export type CreateCampaignInput = z.infer<typeof createCampaignInput>;
