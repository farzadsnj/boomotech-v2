import { services } from "@/content/services";
import type { EnquiryCategory, EnquiryIntent } from "./types";

export type ProblemOption = { id: EnquiryCategory; label: string; examples: string; servicePath: string; intent: EnquiryIntent };

export const problemOptions: ProblemOption[] = [
  { id: "it-problem", label: "Fix an everyday IT problem", examples: "Slow computer, printer, software or device trouble", servicePath: "/services/it-support", intent: "support" },
  { id: "email-accounts", label: "Email, accounts or shared files", examples: "Outlook, Microsoft 365, new users or access", servicePath: "/services/microsoft-365", intent: "support" },
  { id: "network", label: "Improve Wi-Fi or connectivity", examples: "Dropouts, weak coverage or unreliable internet", servicePath: "/services/network-wifi", intent: "support" },
  { id: "security-backup", label: "Protect accounts, devices or files", examples: "Security basics, backups or recovery planning", servicePath: "/services/cybersecurity", intent: "consultation" },
  { id: "ongoing-support", label: "Arrange ongoing IT support", examples: "Maintenance, user changes and clearer ownership", servicePath: "/services/managed-it", intent: "consultation" },
  { id: "website-software", label: "Build or improve a website or tool", examples: "Website, enquiry journey or internal software", servicePath: "/services/web-software", intent: "project" },
  { id: "automation", label: "Reduce repetitive administration", examples: "Data entry, reminders or workflow automation", servicePath: "/services/ai-automation", intent: "project" },
  { id: "equipment-advice", label: "Choose or replace equipment", examples: "Advice before buying a computer or network equipment", servicePath: "/services/it-support", intent: "consultation" },
  { id: "other", label: "Not sure—help me choose", examples: "Describe the situation without selecting a service", servicePath: "other", intent: "consultation" },
];

const optionById = new Map(problemOptions.map((option) => [option.id, option]));

const alternatives: Partial<Record<EnquiryCategory, string[]>> = {
  "it-problem": ["/services/network-wifi", "/services/microsoft-365"],
  "email-accounts": ["/services/it-support", "/services/managed-it"],
  network: ["/services/it-support", "/services/cloud-infrastructure"],
  "security-backup": ["/services/backup-recovery", "/services/cybersecurity"],
  "ongoing-support": ["/services/it-support", "/services/microsoft-365"],
  "website-software": ["/services/ui-ux-branding", "/services/digital-presence"],
  automation: ["/services/web-software", "/services/cloud-infrastructure"],
  "equipment-advice": ["/services/network-wifi"],
};

export function recommendationFor(category: EnquiryCategory, stage: "broken" | "planning" | "unsure" = "unsure") {
  const option = optionById.get(category) ?? optionById.get("other")!;
  const primary = services.find(({ path }) => path === option.servicePath);
  const related = (alternatives[category] ?? []).map((path) => services.find((service) => service.path === path)).filter((service): service is NonNullable<typeof service> => Boolean(service && service.path !== primary?.path)).slice(0, 2);
  const why = primary
    ? `${primary.name} is a practical starting point for ${option.examples.toLowerCase()}. This is a suggested pathway, not a diagnosis.`
    : "You can send the problem in your own words without choosing a service. BoomoTech will review it and identify a suitable starting point.";
  return { option, primary, alternatives: related, stage, why };
}

export const categoryForService = (path: string): EnquiryCategory => {
  const match = problemOptions.find(({ servicePath }) => servicePath === path);
  if (match) return match.id;
  if (path === "/services/backup-recovery") return "security-backup";
  if (["/services/digital-presence", "/services/ui-ux-branding"].includes(path)) return "website-software";
  if (path === "/services/cloud-infrastructure") return "ongoing-support";
  return "other";
};
