"use client";

import { useState } from "react";

export function PasswordInput({ id, name, autoComplete, error, onValue }: { id: string; name: string; autoComplete: string; error?: string; onValue?: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input"><input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} autoComplete={autoComplete} id={id} name={name} onChange={(event) => onValue?.(event.currentTarget.value)} required type={visible ? "text" : "password"} /><button aria-controls={id} aria-label={`${visible ? "Hide" : "Show"} password`} aria-pressed={visible} onClick={() => setVisible((value) => !value)} type="button">{visible ? "Hide" : "Show"}</button></div>;
}

export function PasswordRequirements({ password, confirmation }: { password: string; confirmation?: string }) {
  const codePoints = Array.from(password).length;
  const checks: [boolean, string][] = [
    [codePoints >= 15 && codePoints <= 128, "15–128 characters"],
    [codePoints >= 15, "A long, unique phrase is easier to remember and harder to guess"],
  ];
  if (confirmation !== undefined) checks.push([Boolean(confirmation) && password === confirmation, "Passwords match"]);
  return <ul className="password-requirements" aria-label="Password requirements">{checks.map(([met, label]) => <li className={met ? "is-met" : ""} key={label}><span aria-hidden="true">{met ? "✓" : "○"}</span>{label}</li>)}</ul>;
}
