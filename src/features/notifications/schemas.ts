import { z } from "zod";

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(1000).catch(1),
  limit: z.coerce.number().int().positive().max(20).catch(6),
});

export const notificationMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), id: z.string().uuid() }),
  z.object({ action: z.literal("read-all") }),
]);
