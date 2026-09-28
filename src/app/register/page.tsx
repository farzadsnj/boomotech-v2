import type { Metadata } from "next";
import { AccountForm } from "@/components/auth/account-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Create customer account", description: "Create a secure BoomoTech customer account.", alternates: { canonical: "/register" }, robots: { index: false, follow: false } };
export default function RegisterPage() { return <AuthShell description="Create an account for future customer services. The first version stores your name and email and provides a protected dashboard." eyebrow="Customer account" title="Create your account"><AccountForm mode="register" /></AuthShell>; }
