import { serviceByPath, services } from "@/content/services";

const keywords: Record<string, string[]> = {
  "/services/it-support": ["computer", "device", "printer", "tech support", "it help", "setup"],
  "/services/network-wifi": ["wifi", "wi-fi", "network", "router", "internet", "connection"],
  "/services/cybersecurity": ["security", "cyber", "phishing", "hacked", "mfa", "password"],
  "/services/microsoft-365": ["microsoft", "365", "email", "teams", "sharepoint"],
  "/services/backup-recovery": ["backup", "restore", "recovery", "lost files"],
  "/services/web-software": ["website", "web app", "software", "portal"],
  "/services/ui-ux-branding": ["design", "branding", "ui", "ux", "logo"],
  "/services/digital-presence": ["marketing", "social media", "online presence", "seo"],
  "/services/ai-automation": ["automation", "ai", "workflow", "repetitive"],
  "/services/cloud-infrastructure": ["cloud", "server", "infrastructure", "hosting"],
  "/services/managed-it": ["managed it", "ongoing", "maintenance", "outsourced it"],
};

export type ServiceMatch = { service: (typeof services)[number]; score: number };

export function matchServices(question: string): ServiceMatch[] {
  const input = question.toLowerCase();
  return Object.entries(keywords)
    .map(([path, words]) => ({ service: serviceByPath.get(path as `/${string}`)!, score: words.filter((word) => input.includes(word)).length }))
    .filter(({ service, score }) => service && score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function serviceGuidance(question: string) {
  const matches = matchServices(question);
  if (!matches.length) return { message: "I could not confidently match that request. You can browse the service list or send a consultation request with more detail.", matches };
  const names = matches.slice(0, 2).map(({ service }) => service.name);
  return { message: `BoomoTech may be able to help through ${names.join(names.length > 1 ? " and " : "")}. Here are the closest approved service pages.`, matches };
}
