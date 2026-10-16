type SecurityEvent =
  | "authorization_denied"
  | "origin_rejected"
  | "rate_limit_hit"
  | "security_dependency_unavailable";

const sensitiveKey = /(authorization|cookie|password|secret|token|database|body|message|email|phone)/i;

export function redactSecurityMetadata(metadata: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [
    key,
    sensitiveKey.test(key) ? "[REDACTED]" : typeof value === "string"
      ? value.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[MASKED_EMAIL]")
        .replace(/\+?\d[\d\s().-]{6,}\d/g, "[MASKED_PHONE]")
      : value,
  ]));
}

export function recordSecurityEvent(
  event: SecurityEvent,
  metadata: Record<string, string | number | boolean | null | undefined>,
) {
  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    category: "security",
    event,
    ...redactSecurityMetadata(metadata),
  }));
}
