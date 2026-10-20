import { z } from "zod";
import { bookingOptions } from "@/features/booking/booking-schema";
import { reportingPeriodSchema } from "@/features/dashboard/reporting";
import { requestPrioritySchema, requestStatusSchema } from "./workflow";

export const requestDescriptionSchema = z.string().trim()
  .min(20, "Please provide at least 20 characters.")
  .max(3000, "Use no more than 3,000 characters.");

export const requestMessageSchema = z.string().trim()
  .min(2, "Enter a message.")
  .max(4000, "Use no more than 4,000 characters.");

export const internalNotesSchema = z.string().trim().max(5000, "Use no more than 5,000 characters.");

export const customerRequestActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("edit"), description: requestDescriptionSchema }),
  z.object({ action: z.literal("withdraw") }),
  z.object({ action: z.literal("reply"), message: requestMessageSchema }),
]);

export const adminRequestActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), version: z.number().int().nonnegative() }),
  z.object({ action: z.literal("reply"), message: requestMessageSchema, resolve: z.boolean().optional().default(false), version: z.number().int().nonnegative() }),
  z.object({ action: z.literal("status"), status: requestStatusSchema, version: z.number().int().nonnegative() }),
  z.object({ action: z.literal("priority"), priority: requestPrioritySchema, version: z.number().int().nonnegative() }),
  z.object({ action: z.literal("notes"), notes: internalNotesSchema, version: z.number().int().nonnegative() }),
]);

const serviceValues = new Set(bookingOptions.map(({ value }) => value));
export const adminRequestFiltersSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  period: reportingPeriodSchema.optional().default("all"),
  scope: z.enum(["outstanding"]).optional(),
  status: requestStatusSchema.optional(),
  priority: requestPrioritySchema.optional(),
  service: z.string().refine((value) => serviceValues.has(value), "Unknown service.").optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(["created-desc", "created-asc", "updated-desc", "updated-asc"]).optional().default("created-desc"),
});
