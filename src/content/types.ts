export type SiteLink = { label: string; href: `/${string}` };
export type Faq = { question: string; answer: string };
export type ProcessStep = { number: string; title: string; description: string };
export type Feature = { title: string; description: string };
export type PublicationState = "published" | "draft" | "unavailable";

export type PageBase = {
  path: `/${string}`;
  eyebrow: string;
  title: string;
  description: string;
  metaDescription: string;
  publication: PublicationState;
  indexable: boolean;
};

export type ServiceRecord = PageBase & {
  kind: "service";
  audience: string;
  signals: string[];
  inclusions: string[];
  delivery: string;
  outcomes: string[];
  process: ProcessStep[];
  related: SiteLink[];
  faqs: Faq[];
};

export type SolutionRecord = PageBase & {
  kind: "solution";
  audience: string;
  challenges: Feature[];
  priorities: string[];
  approach: ProcessStep[];
  related: SiteLink[];
};

export type InfoSection = {
  title: string;
  description?: string;
  items?: string[];
};

export type InfoPage = PageBase & {
  kind: "info" | "support" | "booking" | "legal" | "resource" | "shop";
  notice?: { tone: "info" | "safety" | "draft"; title: string; body: string };
  cards?: Feature[];
  sections?: InfoSection[];
  process?: ProcessStep[];
  faqs?: Faq[];
  related?: SiteLink[];
  cta?: SiteLink & { description: string };
};

export type HubPage = PageBase & {
  kind: "services-hub" | "solutions-hub";
};

export type PageRecord = ServiceRecord | SolutionRecord | InfoPage | HubPage;
