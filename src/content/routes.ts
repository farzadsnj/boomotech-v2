import { hubPages, infoPages } from "./pages";
import { services } from "./services";
import { solutions } from "./solutions";
import type { PageRecord } from "./types";

export const allPages: PageRecord[] = [...hubPages, ...services, ...solutions, ...infoPages];
export const pageByPath = new Map(allPages.map((page) => [page.path, page]));
export const intendedPublicRoutes = ["/", ...allPages.map((page) => page.path)] as const;
