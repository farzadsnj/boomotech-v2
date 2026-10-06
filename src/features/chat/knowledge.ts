import { infoPages } from "@/content/pages";
import { services } from "@/content/services";
import { solutions } from "@/content/solutions";

const publicInformationPaths = new Set(["/faq", "/support", "/support/safety", "/book", "/contact", "/privacy", "/cookies"]);

function serviceKnowledge() {
  return services.map((service) => [
    `SERVICE: ${service.name}`,
    `URL: ${service.path}`,
    `SUMMARY: ${service.description}`,
    `FOR: ${service.audience}`,
    `DELIVERY: ${service.delivery}`,
    `CAN INCLUDE: ${service.inclusions.join("; ")}`,
    `HELPFUL NOTES: ${service.faqs.map((faq) => `${faq.question} ${faq.answer}`).join(" ")}`,
  ].join("\n")).join("\n\n");
}

function solutionKnowledge() {
  return solutions.map((solution) => [
    `SOLUTION: ${solution.title}`,
    `URL: ${solution.path}`,
    `SUMMARY: ${solution.description}`,
    `FOR: ${solution.audience}`,
    `PRIORITIES: ${solution.priorities.join("; ")}`,
  ].join("\n")).join("\n\n");
}

function faqKnowledge() {
  return infoPages
    .filter((page) => publicInformationPaths.has(page.path))
    .map((page) => [
      `PAGE: ${page.title}`,
      `URL: ${page.path}`,
      `SUMMARY: ${page.description}`,
      ...(page.notice ? [`NOTICE: ${page.notice.title}. ${page.notice.body}`] : []),
      ...(page.faqs?.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`) ?? []),
    ].join("\n"))
    .join("\n\n");
}

export function buildBoomoTechKnowledge() {
  return [
    "BOOMOTECH PUBLIC WEBSITE KNOWLEDGE",
    "BoomoTech provides practical technology support and smarter systems for Australian small businesses and individuals. It is Brisbane-based, with remote options across Australia where suitable.",
    serviceKnowledge(),
    solutionKnowledge(),
    faqKnowledge(),
  ].join("\n\n");
}

export const boomotechKnowledge = buildBoomoTechKnowledge();
