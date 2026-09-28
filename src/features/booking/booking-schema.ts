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
  phone: z.string().trim().min(1, "Enter a valid phone number.").max(32)
    .regex(/^\+?[\d\s().-]+$/, "Enter a valid phone number.")
    .refine((value) => {
      const digitCount = value.replace(/\D/g, "").length;
      return digitCount >= 8 && digitCount <= 15;
    }, "Enter a valid phone number.")
    .transform((value) => `${value.startsWith("+") ? "+" : ""}${value.replace(/\D/g, "")}`),
  servicePath: z.string().refine((value) => serviceValues.has(value), "Choose a service."),
  message: z.string().trim().min(20, "Please add a little more detail.").max(3000),
  consent: z.literal(true, { error: "Consent is required before sending." }),
  website: z.string().max(0).optional().default(""),
});

export const bookingContactSchema = bookingRequestSchema.pick({ fullName: true, email: true, phone: true });
export const bookingDetailsSchema = bookingRequestSchema.pick({ servicePath: true, message: true, consent: true });
export type BookingField = keyof z.input<typeof bookingRequestSchema>;

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export function serviceLabel(value: string) {
  return bookingOptions.find((item) => item.value === value)?.label ?? "Other";
}
