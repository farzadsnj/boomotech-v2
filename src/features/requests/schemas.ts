import { z } from "zod";
import { bookingOptions } from "@/features/booking/booking-schema";
import { requestPrioritySchema, requestStatusSchema } from "./workflow";

export const requestDescriptionSchema = z.string().trim()
  .min(20, "Please provide at least 20 characters.")
  .max(3000, "Use no more than 3,000 characters.");

export const requestMessageSchema = z.string().trim()
  .min(2, "Enter a message.")
  .max(4000, "Use no more than 4,000 characters.");

export const customerRequestActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("edit"), description: requestDescriptionSchema }),
  z.object({ action: z.literal("withdraw") }),
  z.object({ action: z.literal("reply"), message: requestMessageSchema }),
]);

export const adminRequestActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("reply"), message: requestMessageSchema, resolve: z.boolean().optional().default(false) }),
  z.object({ action: z.literal("status"), status: requestStatusSchema }),
  z.object({ action: z.literal("priority"), priority: requestPrioritySchema }),
]);

const serviceValues = new Set(bookingOptions.map(({ value }) => value));
export const adminRequestFiltersSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  status: requestStatusSchema.optional(),
  priority: requestPrioritySchema.optional(),
  service: z.string().refine((value) => serviceValues.has(value), "Unknown service.").optional(),
  search: z.string().trim().max(100).optional(),
});
