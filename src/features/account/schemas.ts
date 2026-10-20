import { z } from "zod";
import { accountPasswordSchema } from "@/lib/auth/schemas";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100, "Use no more than 100 characters."),
}).strict();

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(128, "Password is too long."),
  newPassword: accountPasswordSchema,
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  if (value.currentPassword === value.newPassword) context.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a password different from your current password." });
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
