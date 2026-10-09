"use client";

import { useState } from "react";

export function PasswordInput({ id, name, autoComplete, error, onValue }: { id: string; name: string; autoComplete: string; error?: string; onValue?: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input"><input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} autoComplete={autoComplete} id={id} name={name} onChange={(event) => onValue?.(event.currentTarget.value)} required type={visible ? "text" : "password"} /><button aria-controls={id} aria-label={`${visible ? "Hide" : "Show"} password`} aria-pressed={visible} onClick={() => setVisible((value) => !value)} type="button">{visible ? "Hide" : "Show"}</button></div>;
}

export function PasswordRequirements({ password, confirmation }: { password: string; confirmation?: string }) {
  const checks: [boolean, string][] = [
    [password.length >= 12 && password.length <= 128, "12–128 characters"],
    [/[A-Z]/.test(password), "An uppercase letter"],
    [/[a-z]/.test(password), "A lowercase letter"],
    [/[0-9]/.test(password), "A number"],
  ];
  if (confirmation !== undefined) checks.push([Boolean(confirmation) && password === confirmation, "Passwords match"]);
  return <ul className="password-requirements" aria-label="Password requirements">{checks.map(([met, label]) => <li className={met ? "is-met" : ""} key={label}><span aria-hidden="true">{met ? "✓" : "○"}</span>{label}</li>)}</ul>;
}
