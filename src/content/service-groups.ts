import { services } from "./services";

export const serviceGroupDefinitions = [
  {
    id: "support",
    label: "Support",
    heading: "Keep everyday technology working",
    description: "Practical help for devices, accounts, Microsoft 365 and the systems your team relies on.",
    accent: "sky",
    paths: ["/services/it-support", "/services/managed-it", "/services/microsoft-365"]
  },
  {
    id: "secure",
    label: "Secure",
    heading: "Protect access, data and continuity",
    description: "Strengthen the foundations around networks, security, backups and recovery planning.",
    accent: "navy",
    paths: ["/services/cybersecurity", "/services/backup-recovery", "/services/network-wifi"]
  },
  {
    id: "improve",
    label: "Improve",
    heading: "Make systems clearer and more capable",
    description: "Review infrastructure, cloud tools and repetitive work with practical improvement in mind.",
    accent: "cyan",
    paths: ["/services/cloud-infrastructure", "/services/ai-automation"]
  },
  {
    id: "build",
    label: "Build",
    heading: "Create useful digital experiences",
    description: "Shape websites, software, digital presence and brand experiences around a real customer need.",
    accent: "warm",
    paths: ["/services/web-software", "/services/digital-presence", "/services/ui-ux-branding"]
  }
] as const;

const byPath = new Map(services.map((service) => [service.path, service]));

export const serviceGroups = serviceGroupDefinitions.map((group) => ({
  ...group,
  services: group.paths.map((path) => byPath.get(path)).filter((service): service is NonNullable<typeof service> => Boolean(service))
}));

export const serviceGroupForPath = (path: string) => serviceGroups.find((group) => group.paths.includes(path as never));
