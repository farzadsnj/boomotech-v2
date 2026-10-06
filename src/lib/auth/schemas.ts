import { z } from "zod";

const email = z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address.").transform((value) => value.toLocaleLowerCase("en-AU"));
export const accountPasswordSchema = z.string().min(12, "Use at least 12 characters.").max(128, "Use no more than 128 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.").regex(/[A-Z]/, "Include an uppercase letter.").regex(/[0-9]/, "Include a number.");

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100, "Use no more than 100 characters."),
  email,
  password: accountPasswordSchema,
  confirmPassword: z.string().min(1, "Confirm your password."),
}).superRefine((value, context) => {
  if (value.password !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128, "Password is too long."),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(3, "Enter your administrator username.").max(32, "Username is too long."),
  password: z.string().min(1, "Enter your password.").max(128, "Password is too long."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  password: accountPasswordSchema,
  confirmPassword: z.string().min(1, "Confirm your password."),
}).superRefine((value, context) => {
  if (value.password !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type LoginInput = z.input<typeof loginSchema>;
