export function getSiteUrl(): URL {
  const candidate = process.env.SITE_URL?.trim();
  if (!candidate && process.env.NODE_ENV === "production") {
    throw new Error("Site configuration error: set SITE_URL before building or starting production.");
  }
  try {
    return new URL(candidate || "http://localhost:3000");
  } catch {
    if (process.env.NODE_ENV === "production") throw new Error("Site configuration error: SITE_URL must be a valid absolute URL.");
    return new URL("http://localhost:3000");
  }
}

export function isIndexingEnabled(): boolean {
  return process.env.SITE_INDEXING_ENABLED === "true" && getSiteUrl().protocol === "https:";
}
