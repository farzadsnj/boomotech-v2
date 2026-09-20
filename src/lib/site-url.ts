export function getSiteUrl(): URL {
  const candidate = process.env.SITE_URL?.trim();
  try {
    return new URL(candidate || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function isIndexingEnabled(): boolean {
  return process.env.SITE_INDEXING_ENABLED === "true" && getSiteUrl().protocol === "https:";
}
