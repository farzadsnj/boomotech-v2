import { hubPages, infoPages } from "./pages";
import { services } from "./services";
import { solutions } from "./solutions";
import type { PageRecord } from "./types";
import { publishedArticles } from "./blog";

export const allPages: PageRecord[] = [...hubPages, ...services, ...solutions, ...infoPages];
export const pageByPath = new Map(allPages.map((page) => [page.path, page]));
export const indexablePagePaths = allPages
  .filter((page) => page.indexing === "public")
  .map((page) => page.path);
export const intendedPublicRoutes = ["/", ...indexablePagePaths, "/blog", "/tools/it-health-check", ...publishedArticles.map(({ slug }) => `/blog/${slug}` as const)] as const;
export const isPageIndexable = (path: string) => indexablePagePaths.includes(path as `/${string}`);
