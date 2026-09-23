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

type IndexingRecord = { publication: "published" | "draft" | "unavailable"; indexable: boolean };

export function isPageIndexable(page: IndexingRecord): boolean {
  return isIndexingEnabled() && page.publication === "published" && page.indexable;
}

export function getRobotsPolicy(page: IndexingRecord) {
  const allowed = isPageIndexable(page);
  return { index: allowed, follow: allowed };
}
