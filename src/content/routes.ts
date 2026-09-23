import { hubPages, infoPages } from "./pages";
import { services } from "./services";
import { solutions } from "./solutions";
import type { PageRecord } from "./types";

export const allPages: PageRecord[] = [...hubPages, ...services, ...solutions, ...infoPages];
export const pageByPath = new Map(allPages.map((page) => [page.path, page]));
export const homePublication = { publication: "published", indexable: true } as const;
export const allRoutePaths = ["/", ...allPages.map((page) => page.path)] as const;
export const sitemapRoutes = [
  "/",
  ...allPages
    .filter((page) => page.publication === "published" && page.indexable)
    .map((page) => page.path),
] as const;
