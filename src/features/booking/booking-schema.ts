import { z } from "zod";
import { services } from "@/content/services";
import { audienceLabels, categoryLabels, enquiryAudiences, enquiryCategories, enquiryIntents } from "@/features/enquiry/types";

export const OTHER_SERVICE = "other";
export const bookingOptions = [
  ...services.map(({ path, name }) => ({ value: path, label: name })),
  { value: OTHER_SERVICE, label: "Not sure / another request" },
];
const serviceValues = new Set(bookingOptions.map(({ value }) => value));

const phoneSchema = z.string().trim().max(32).refine((value) => value === "" || /^\+?[\d\s().-]+$/.test(value), "Enter a valid phone number.")
  .refine((value) => {
    if (!value) return true;
    const digitCount = value.replace(/\D/g, "").length;
    return digitCount >= 8 && digitCount <= 15;
  }, "Enter a valid phone number.")
  .transform((value) => value ? `${value.startsWith("+") ? "+" : ""}${value.replace(/\D/g, "")}` : "");

const contactShape = {
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  preferredContact: z.enum(["email", "phone"]).default("email"),
  phone: phoneSchema.default(""),
  businessName: z.string().trim().max(120).default(""),
};

const validatePhonePreference = (value: { preferredContact: "email" | "phone"; phone: string }, context: z.RefinementCtx) => {
  if (value.preferredContact === "phone" && !value.phone) context.addIssue({ code: "custom", path: ["phone"], message: "Enter a phone number if you prefer a phone call." });
};

export const bookingProblemSchema = z.object({
  audience: z.enum(enquiryAudiences).default("unsure"),
  category: z.enum(enquiryCategories).default("other"),
  servicePath: z.string().default(OTHER_SERVICE).refine((value) => serviceValues.has(value), "Choose a service or select ‘Not sure’."),
  intent: z.enum(enquiryIntents).default("consultation"),
  message: z.string().trim().min(20, "Please add a little more detail.").max(3000),
  preparation: z.array(z.object({ question: z.string().trim().min(1).max(180), answer: z.string().trim().min(1).max(300) })).max(8).default([]),
});
export const bookingContactSchema = z.object(contactShape).superRefine(validatePhonePreference);
export const bookingReviewSchema = z.object({ consent: z.literal(true, { error: "Consent is required before sending." }) });

export const bookingRequestSchema = z.object({
  ...bookingProblemSchema.shape,
  ...contactShape,
  consent: bookingReviewSchema.shape.consent,
  source: z.enum(["booking-page", "chatbot"]).default("booking-page"),
  website: z.string().max(0).optional().default(""),
}).superRefine(validatePhonePreference);

export const bookingFieldSchemas = {
  ...bookingProblemSchema.shape,
  ...contactShape,
  consent: bookingReviewSchema.shape.consent,
  website: z.string().max(0),
};

export type BookingField = keyof typeof bookingFieldSchemas;
export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type BookingRequestInput = z.input<typeof bookingRequestSchema>;

export function serviceLabel(value: string) {
  return bookingOptions.find((item) => item.value === value)?.label ?? "Not sure / another request";
}
export const audienceLabel = (value: BookingRequest["audience"]) => audienceLabels[value];
export const categoryLabel = (value: BookingRequest["category"]) => categoryLabels[value];

export function formatBookingMessage(request: BookingRequest) {
  const context = [
    `Request type: ${request.intent}`,
    `Audience: ${audienceLabel(request.audience)}`,
    `Problem or goal: ${categoryLabel(request.category)}`,
    ...(request.businessName ? [`Business: ${request.businessName}`] : []),
    `Preferred contact: ${request.preferredContact === "phone" ? "Phone or email" : "Email"}`,
    ...request.preparation.map(({ question, answer }) => `${question}: ${answer}`),
  ];
  return `${request.message}\n\nPreparation summary\n${context.join("\n")}`;
}
