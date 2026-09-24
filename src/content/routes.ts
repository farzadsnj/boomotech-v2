import { hubPages, infoPages } from "./pages";
import { services } from "./services";
import { solutions } from "./solutions";
import type { PageRecord } from "./types";
import { publishedArticles } from "./blog";

export const allPages: PageRecord[] = [...hubPages, ...services, ...solutions, ...infoPages];
export const pageByPath = new Map(allPages.map((page) => [page.path, page]));
const approvedInfoPaths = new Set(["/resources", "/faq", "/about", "/blog"]);
export const indexablePagePaths = allPages
  .filter((page) => page.kind === "service" || page.kind === "solution" || page.kind === "services-hub" || page.kind === "solutions-hub" || approvedInfoPaths.has(page.path))
  .map((page) => page.path);
export const intendedPublicRoutes = ["/", ...indexablePagePaths, ...publishedArticles.map(({ slug }) => `/blog/${slug}` as const)] as const;
export const isPageIndexable = (path: string) => indexablePagePaths.includes(path as `/${string}`);
