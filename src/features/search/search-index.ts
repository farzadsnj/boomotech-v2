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
};

const normalise = (value: string) => value.toLocaleLowerCase("en-AU").replace(/[^a-z0-9]+/g, " ").trim();
const join = (...values: (string | string[] | undefined)[]) => values.flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).join(" ");

const publicInfo = infoPages.filter((page) => page.kind !== "legal" && !page.path.startsWith("/book"));

export const searchIndex: SearchRecord[] = [
  ...services.map((service) => ({
    path: service.path, title: service.title, description: service.description, category: "Service" as const,
    body: join(service.name, service.audience, service.signals, service.inclusions, service.delivery, service.outcomes, service.faqs.flatMap((faq) => [faq.question, faq.answer])),
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
    body: join(page.metaDescription, page.cards?.flatMap((item) => [item.title, item.description]), page.resources?.flatMap((item) => [item.title, item.description, item.topic]), page.sections?.flatMap((section) => [section.title, ...(section.description ? [section.description] : []), ...(section.items ?? [])]), page.faqs?.flatMap((faq) => [faq.question, faq.answer])),
  })),
];

export function searchSite(query: string, limit = 8): SearchRecord[] {
  const phrase = normalise(query);
  if (phrase.length < 2) return [];
  const terms = [...new Set(phrase.split(" ").filter((term) => term.length > 1))];
  return searchIndex
    .map((record) => {
      const title = normalise(record.title);
      const description = normalise(record.description);
      const body = normalise(record.body);
      let score = 0;
      if (title === phrase) score += 100;
      if (title.startsWith(phrase)) score += 45;
      if (title.includes(phrase)) score += 32;
      if (description.includes(phrase)) score += 16;
      if (body.includes(phrase)) score += 8;
      for (const term of terms) {
        if (title.split(" ").includes(term)) score += 10;
        if (description.split(" ").includes(term)) score += 4;
        if (body.split(" ").includes(term)) score += 1;
      }
      return { record, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, limit)
    .map(({ record }) => record);
}
