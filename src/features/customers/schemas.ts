import { z } from "zod";

export const customerDirectoryFiltersSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  search: z.string().trim().max(100).optional(),
  verification: z.enum(["verified", "unverified"]).optional(),
  sort: z.enum(["registered-desc", "registered-asc", "name-asc", "name-desc", "requests-desc", "requests-asc"]).optional().default("registered-desc"),
});

export type CustomerDirectoryFilters = z.infer<typeof customerDirectoryFiltersSchema>;

