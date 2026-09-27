import { serviceByPath, services } from "@/content/services";

type WeightedTerm = readonly [term: string, weight: number];
const rules: Record<string, WeightedTerm[]> = {
  "/services/it-support": [["slow computer", 6], ["slow laptop", 6], ["printer problem", 6], ["new office setup", 5], ["computer", 3], ["computers", 3], ["laptop", 3], ["printer", 4], ["device", 2], ["it help", 5], ["it support", 5]],
  "/services/network-wifi": [["new office setup", 4], ["wi fi", 5], ["wifi", 5], ["internet problem", 5], ["network problem", 5], ["slow internet", 5], ["network", 3], ["router", 4], ["internet", 3], ["connection", 2]],
  "/services/cybersecurity": [["hacked account", 7], ["security concern", 6], ["cyber security", 6], ["phishing", 6], ["hacked", 5], ["security", 3], ["mfa", 4], ["password", 2]],
  "/services/microsoft-365": [["microsoft 365", 7], ["microsoft365", 7], ["office 365", 7], ["email problem", 6], ["email", 4], ["outlook", 5], ["teams", 3], ["sharepoint", 5]],
  "/services/backup-recovery": [["lost files", 7], ["data recovery", 7], ["file recovery", 7], ["backup", 5], ["restore", 5], ["recovery", 4]],
  "/services/web-software": [["website creation", 7], ["new website", 7], ["website problem", 6], ["web application", 6], ["website", 4], ["software", 3], ["portal", 3]],
  "/services/ui-ux-branding": [["user experience", 6], ["interface design", 6], ["brand design", 6], ["ui", 4], ["ux", 4], ["branding", 5], ["logo", 3]],
  "/services/digital-presence": [["social media", 7], ["online presence", 7], ["digital marketing", 7], ["marketing", 3], ["seo", 4]],
  "/services/ai-automation": [["repetitive administration", 8], ["repetitive admin", 7], ["workflow automation", 7], ["automation", 5], ["ai", 4], ["workflow", 3]],
  "/services/cloud-infrastructure": [["cloud server", 7], ["cloud hosting", 7], ["server", 4], ["cloud", 4], ["infrastructure", 5], ["hosting", 4]],
  "/services/managed-it": [["ongoing it support", 8], ["outsourced it", 7], ["managed it", 7], ["ongoing support", 5], ["maintenance", 3]],
};

export type ServiceMatch = { service: (typeof services)[number]; score: number; reasons: string[] };

export function normalizeQuestion(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function containsTerm(input: string, term: string) {
  const normalizedTerm = normalizeQuestion(term);
  return ` ${input} `.includes(` ${normalizedTerm} `);
}

export function matchServices(question: string): ServiceMatch[] {
  const input = normalizeQuestion(question);
  if (!input) return [];
  return Object.entries(rules)
    .map(([path, terms]) => {
      const matched = terms.filter(([term]) => containsTerm(input, term));
      return { service: serviceByPath.get(path as `/${string}`)!, score: matched.reduce((total, [, weight]) => total + weight, 0), reasons: matched.map(([term]) => term) };
    })
    .filter(({ service, score }) => service && score >= 3)
    .sort((a, b) => b.score - a.score || a.service.name.localeCompare(b.service.name))
    .slice(0, 3);
}

export function serviceGuidance(question: string) {
  const matches = matchServices(question);
  if (!matches.length) return { message: "I could not confidently match that request. Browse the service categories or describe the problem in a little more detail.", matches };
  const names = matches.slice(0, 2).map(({ service }) => service.name);
  return { message: `The closest matches are ${names.join(names.length > 1 ? " and " : "")}. These suggestions use the approved service catalogue and do not diagnose the underlying issue.`, matches };
}
