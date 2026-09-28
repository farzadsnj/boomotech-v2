"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import type { ZodError } from "zod";
import { authClient } from "@/lib/auth/client";
import { adminLoginSchema, loginSchema, registrationSchema } from "@/lib/auth/schemas";

type Mode = "register" | "login" | "admin";
type Errors = Record<string, string>;

function errorsFrom(error: ZodError): Errors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
}

export function AccountForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const validation = mode === "register" ? registrationSchema.safeParse(values) : mode === "admin" ? adminLoginSchema.safeParse(values) : loginSchema.safeParse(values);
    if (!validation.success) {
      const nextErrors = errorsFrom(validation.error);
      setErrors(nextErrors);
      const first = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => (form.elements.namedItem(first) as HTMLElement | null)?.focus());
      return;
    }
    setErrors({});
    setPending(true);
    try {
      if (mode === "register") {
        const parsed = registrationSchema.parse(values);
        const result = await authClient.signUp.email({ name: parsed.name, email: parsed.email, password: parsed.password });
        if (result.error) throw new Error("registration");
        router.push("/dashboard");
      } else if (mode === "admin") {
        const parsed = adminLoginSchema.parse(values);
        const result = await authClient.signIn.username({ username: parsed.username, password: parsed.password });
        if (result.error) throw new Error("login");
        router.push("/admin");
      } else {
        const parsed = loginSchema.parse(values);
        const result = await authClient.signIn.email({ email: parsed.email, password: parsed.password });
        if (result.error) throw new Error("login");
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setFormError(mode === "register" ? "We could not create the account. Check the details or try again later." : "The sign-in details could not be verified.");
    } finally {
      setPending(false);
    }
  }

  function clearFieldError(name: string, value: string) {
    if (!errors[name]) return;
    const form = formRef.current;
    if (!form) return;
    const values = Object.fromEntries(new FormData(form));
    values[name] = value;
    const schema = mode === "register" ? registrationSchema : mode === "admin" ? adminLoginSchema : loginSchema;
    const parsed = schema.safeParse(values);
    const stillInvalid = !parsed.success && parsed.error.issues.some((issue) => issue.path[0] === name);
    if (!stillInvalid) setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
  }

  const field = (name: string, label: string, type: string, autoComplete: string) => <div className="auth-field">
    <label htmlFor={`${mode}-${name}`}>{label} <span aria-hidden="true">*</span></label>
    <input aria-describedby={errors[name] ? `${mode}-${name}-error` : undefined} aria-invalid={Boolean(errors[name])} autoComplete={autoComplete} id={`${mode}-${name}`} name={name} onChange={(event) => clearFieldError(name, event.currentTarget.value)} required type={type} />
    {errors[name] ? <p className="auth-field__error" id={`${mode}-${name}-error`}>{errors[name]}</p> : null}
  </div>;

  return <form className="auth-form" noValidate onSubmit={submit} ref={formRef}>
    <p className="auth-form__required"><span aria-hidden="true">*</span> Required fields</p>
    {mode === "register" ? field("name", "Full name", "text", "name") : null}
    {mode === "admin" ? field("username", "Administrator username", "text", "username") : field("email", "Email address", "email", "email")}
    {field("password", "Password", "password", mode === "register" ? "new-password" : "current-password")}
    {mode === "register" ? field("confirmPassword", "Confirm password", "password", "new-password") : null}
    {mode === "register" ? <p className="auth-form__hint">Use 12–128 characters with uppercase and lowercase letters and a number.</p> : null}
    {formError ? <p className="auth-form__error" role="alert">{formError}</p> : null}
    <button className="auth-submit" disabled={pending} type="submit">{pending ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button>
    {mode === "register" ? <p className="auth-form__alternate">Already registered? <Link href="/login">Sign in</Link></p> : mode === "login" ? <p className="auth-form__alternate">New customer? <Link href="/register">Create an account</Link></p> : null}
  </form>;
}
