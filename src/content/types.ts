export type SiteLink = { label: string; href: `/${string}` };
export type Faq = { question: string; answer: string; links?: SiteLink[] };
export type ProcessStep = { number: string; title: string; description: string };
export type Feature = { title: string; description: string; href?: `/${string}`; action?: string };
export type ResourceCard = Feature & { href: `/${string}`; action: string; topic: string; format: string; readTime: string; relatedService: string; featured?: boolean };
export type VisualAsset = { src: string; alt: string };
export type ServiceExample = {
  situation: string;
  assessment: string;
  deliverables: string[];
};
export type ServiceDiagramStage = { label: string; detail?: string; options?: string[] };
export type ServiceDiagram =
  | { kind: "flow"; title: string; caption: string; stages: ServiceDiagramStage[] }
  | { kind: "layers"; title: string; caption: string; layers: ServiceDiagramStage[] }
  | { kind: "comparison"; title: string; caption: string; columns: Array<{ title: string; items: string[] }> }
  | { kind: "before-after"; title: string; caption: string; before: string[]; after: string[] };

export type PageBase = {
  path: `/${string}`;
  indexing: "public" | "noindex";
  eyebrow: string;
  title: string;
  description: string;
  metaDescription: string;
};

export type ServiceRecord = PageBase & {
  kind: "service";
  name: string;
  visual: VisualAsset;
  audience: string;
  signals: string[];
  problems: Feature[];
  inclusions: string[];
  separateAgreement: string[];
  delivery: string;
  outcomes: string[];
  diagram: ServiceDiagram;
  example: ServiceExample;
  process: ProcessStep[];
  processTitle: string;
  ctaLabel: string;
  ctaTitle: string;
  preparation: string;
  related: SiteLink[];
  faqs: Faq[];
};

export type SolutionRecord = PageBase & {
  kind: "solution";
  visual: VisualAsset;
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
  kind: "info" | "support" | "booking" | "legal" | "resource";
  notice?: { tone: "info" | "safety" | "draft"; title: string; body: string };
  cards?: Feature[];
  resources?: ResourceCard[];
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
