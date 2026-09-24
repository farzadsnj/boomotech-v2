import { z } from "zod";
import { services } from "@/content/services";

export const OTHER_SERVICE = "other";
export const bookingOptions = [
  ...services.map(({ path, name }) => ({ value: path, label: name })),
  { value: OTHER_SERVICE, label: "Other" },
];

const serviceValues = new Set(bookingOptions.map(({ value }) => value));

export const bookingRequestSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  phone: z.string().trim().min(8, "Enter a valid phone number.").max(32)
    .refine((value) => /^[+()\d\s.-]+$/.test(value), "Enter a valid phone number.")
    .transform((value) => value.replace(/[().\s-]+/g, "")),
  servicePath: z.string().refine((value) => serviceValues.has(value), "Choose a service."),
  message: z.string().trim().min(20, "Please add a little more detail.").max(3000),
  consent: z.literal(true, { error: "Consent is required before sending." }),
  website: z.string().max(0).optional().default(""),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export function serviceLabel(value: string) {
  return bookingOptions.find((item) => item.value === value)?.label ?? "Other";
}
