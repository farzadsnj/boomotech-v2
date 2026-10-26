import { publishedArticles } from "@/content/blog";
import { hubPages, infoPages } from "@/content/pages";
import { services } from "@/content/services";
import { solutions } from "@/content/solutions";

export type SearchRecord = {
  path: string;
  title: string;
  description: string;
  category: "Service" | "Solution" | "Resource" | "Article" | "Support" | "Information";
  body: string;
  aliases?: string[];
};

const stopWords = new Set(["a", "an", "and", "are", "can", "do", "for", "help", "i", "is", "it", "me", "my", "need", "of", "our", "the", "to", "we", "with"]);
export const normaliseSearchText = (value: string) => value.toLocaleLowerCase("en-AU")
  .replace(/wi[\s-]?fi/g, "wifi")
  .replace(/e[\s-]?mail/g, "email")
  .replace(/microsoft\s*365|office\s*365/g, "microsoft365")
  .replace(/[^a-z0-9]+/g, " ").trim();
const meaningfulTerms = (value: string) => [...new Set(normaliseSearchText(value).split(" ").filter((term) => term.length > 1 && !stopWords.has(term)))];
const join = (...values: (string | string[] | undefined)[]) => values.flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).join(" ");

const aliases: Record<string, string[]> = {
  "/services/it-support": ["slow laptop", "laptop slow", "slow computer", "computer freezing", "computer not working", "printer offline", "printer not connecting", "device problem", "software error", "equipment advice"],
  "/services/managed-it": ["ongoing it support", "managed it", "regular maintenance", "technology owner", "joiner leaver", "new starter setup"],
  "/services/microsoft-365": ["business email not working", "outlook not working", "email problem", "microsoft 365 login", "new employee account", "new staff account", "shared files", "teams onedrive sharepoint"],
  "/services/network-wifi": ["wifi keeps dropping", "wifi dropout", "wireless problem", "internet dropping", "slow wifi", "weak wifi", "network problem", "router access point"],
  "/services/cybersecurity": ["hacked account", "phishing", "security concern", "multi factor authentication", "mfa", "device security"],
  "/services/backup-recovery": ["backup files", "lost files", "recover files", "restore data", "what is backed up"],
  "/services/cloud-infrastructure": ["server cloud hosting", "cloud storage", "hybrid infrastructure", "hosting system"],
  "/services/ai-automation": ["automate repetitive admin", "repetitive data entry", "workflow automation", "automatic reminders", "reduce administration"],
  "/services/web-software": ["need a website", "website not working", "enquiry form not working", "build an app", "internal tool", "software project"],
  "/services/digital-presence": ["online presence", "business listing", "social media", "customers find business", "service messaging"],
  "/services/ui-ux-branding": ["ui ux", "user experience", "interface design", "branding", "logo identity", "confusing navigation"],
};

const publicInfo = infoPages.filter((page) => page.kind !== "legal" && !page.path.startsWith("/book"));

export const searchIndex: SearchRecord[] = [
  ...services.map((service) => ({
    path: service.path, title: service.name, description: service.description, category: "Service" as const, aliases: aliases[service.path] ?? [],
    body: join(service.title, service.audience, service.signals, service.problems.flatMap((item) => [item.title, item.description]), service.inclusions, service.delivery, service.outcomes, service.faqs.flatMap((faq) => [faq.question, faq.answer])),
  })),
  ...solutions.map((solution) => ({
    path: solution.path, title: solution.title, description: solution.description, category: "Solution" as const,
    body: join(solution.audience, solution.challenges.flatMap((item) => [item.title, item.description]), solution.priorities, solution.approach.flatMap((step) => [step.title, step.description])),
  })),
  ...publishedArticles.map((article) => ({
    path: `/blog/${article.slug}`, title: article.title, description: article.excerpt, category: "Article" as const,
    body: join(article.category, article.summary, article.sections.flatMap((section) => [section.title, ...section.paragraphs, ...(section.points ?? [])])),
  })),
  ...hubPages.map((page) => ({ path: page.path, title: page.title, description: page.description, category: page.kind === "services-hub" ? "Service" as const : "Solution" as const, body: page.metaDescription })),
  ...publicInfo.map((page) => ({
    path: page.path, title: page.title, description: page.description,
    category: page.path === "/resources" ? "Resource" as const : page.kind === "support" ? "Support" as const : "Information" as const,
    body: join(page.metaDescription, page.cards?.flatMap((item) => [item.title, item.description]), page.sections?.flatMap((section) => [section.title, ...(section.description ? [section.description] : []), ...(section.items ?? [])]), page.faqs?.flatMap((faq) => [faq.question, faq.answer])),
  })),
];

export function searchSite(query: string, limit = 8): SearchRecord[] {
  const phrase = normaliseSearchText(query);
  const terms = meaningfulTerms(query);
  if (phrase.length < 2 || terms.length === 0) return [];
  return searchIndex.map((record) => {
    const title = normaliseSearchText(record.title);
    const description = normaliseSearchText(record.description);
    const body = normaliseSearchText(record.body);
    let score = 0;
    if (title === phrase) score += 120;
    if (title.includes(phrase) || phrase.includes(title)) score += 45;
    for (const aliasValue of record.aliases ?? []) {
      const alias = normaliseSearchText(aliasValue);
      const aliasTerms = meaningfulTerms(aliasValue);
      if (phrase === alias) score += 160;
      else if (phrase.includes(alias) || alias.includes(phrase)) score += 100;
      else if (aliasTerms.length > 1 && aliasTerms.every((term) => terms.includes(term))) score += 75;
    }
    for (const term of terms) {
      if (title.split(" ").includes(term)) score += 14;
      if (description.split(" ").includes(term)) score += 5;
      if (body.split(" ").includes(term)) score += 1;
    }
    if (record.category === "Service" && score >= 20) score += 12;
    return { record, score };
  }).filter(({ score }) => score >= 8)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, limit).map(({ record }) => record);
}
