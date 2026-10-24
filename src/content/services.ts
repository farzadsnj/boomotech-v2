import { serviceDetails } from "./service-details";
import type { ServiceRecord, SiteLink, VisualAsset } from "./types";

const serviceVisuals: Record<ServiceRecord["path"], VisualAsset> = {
  "/services/it-support": { src: "/visuals/services/it-support.svg", alt: "A computer with a practical support toolkit" },
  "/services/managed-it": { src: "/visuals/services/managed-it.svg", alt: "Connected systems being maintained through an agreed plan" },
  "/services/microsoft-365": { src: "/visuals/services/microsoft-365.svg", alt: "A connected email, collaboration and shared-file workspace" },
  "/services/cloud-infrastructure": { src: "/visuals/services/cloud-infrastructure.svg", alt: "Cloud services connected to business systems" },
  "/services/network-wifi": { src: "/visuals/services/network-wifi.svg", alt: "Network devices connected through wired and Wi-Fi paths" },
  "/services/cybersecurity": { src: "/visuals/services/cybersecurity.svg", alt: "A shield protecting a business account" },
  "/services/backup-recovery": { src: "/visuals/services/backup-recovery.svg", alt: "Protected data with a tested recovery path" },
  "/services/ai-automation": { src: "/visuals/services/ai-automation.svg", alt: "A controlled workflow connecting repeatable tasks" },
  "/services/web-software": { src: "/visuals/services/web-software.svg", alt: "A structured website and software interface" },
  "/services/digital-presence": { src: "/visuals/services/digital-presence.svg", alt: "Connected discovery, service and enquiry touchpoints" },
  "/services/ui-ux-branding": { src: "/visuals/services/ui-ux-branding.svg", alt: "Interface, user journey and brand design components" },
};

const catalogue: Array<{ path: ServiceRecord["path"]; name: string; related: SiteLink[] }> = [
  { path: "/services/it-support", name: "IT support", related: [{ label: "Network and Wi-Fi", href: "/services/network-wifi" }, { label: "Microsoft 365", href: "/services/microsoft-365" }, { label: "Support safety", href: "/support/safety" }] },
  { path: "/services/managed-it", name: "Managed IT", related: [{ label: "Cybersecurity", href: "/services/cybersecurity" }, { label: "Backup and recovery", href: "/services/backup-recovery" }, { label: "Small business solutions", href: "/solutions/small-business" }] },
  { path: "/services/microsoft-365", name: "Microsoft 365", related: [{ label: "Cybersecurity", href: "/services/cybersecurity" }, { label: "Cloud and infrastructure", href: "/services/cloud-infrastructure" }, { label: "Remote work", href: "/solutions/remote-work" }] },
  { path: "/services/cloud-infrastructure", name: "Cloud and infrastructure", related: [{ label: "Microsoft 365", href: "/services/microsoft-365" }, { label: "Backup and recovery", href: "/services/backup-recovery" }, { label: "Cybersecurity", href: "/services/cybersecurity" }] },
  { path: "/services/network-wifi", name: "Network and Wi-Fi", related: [{ label: "IT support", href: "/services/it-support" }, { label: "Cybersecurity", href: "/services/cybersecurity" }, { label: "Home office solutions", href: "/solutions/home-office-individuals" }] },
  { path: "/services/cybersecurity", name: "Cybersecurity", related: [{ label: "Backup and recovery", href: "/services/backup-recovery" }, { label: "Microsoft 365", href: "/services/microsoft-365" }, { label: "Support safety", href: "/support/safety" }] },
  { path: "/services/backup-recovery", name: "Backup and recovery", related: [{ label: "Cybersecurity", href: "/services/cybersecurity" }, { label: "Cloud and infrastructure", href: "/services/cloud-infrastructure" }, { label: "Managed IT", href: "/services/managed-it" }] },
  { path: "/services/ai-automation", name: "AI and automation", related: [{ label: "Web and software", href: "/services/web-software" }, { label: "Small business solutions", href: "/solutions/small-business" }, { label: "Project discovery", href: "/book/project-discovery" }] },
  { path: "/services/web-software", name: "Web and software", related: [{ label: "UI, UX and branding", href: "/services/ui-ux-branding" }, { label: "Digital presence", href: "/services/digital-presence" }, { label: "AI and automation", href: "/services/ai-automation" }] },
  { path: "/services/digital-presence", name: "Digital presence", related: [{ label: "Web and software", href: "/services/web-software" }, { label: "UI, UX and branding", href: "/services/ui-ux-branding" }, { label: "Resources", href: "/resources" }] },
  { path: "/services/ui-ux-branding", name: "UI, UX and branding", related: [{ label: "Web and software", href: "/services/web-software" }, { label: "Digital presence", href: "/services/digital-presence" }, { label: "Project discovery", href: "/book/project-discovery" }] },
];

export const services: ServiceRecord[] = catalogue.map(({ path, name, related }) => ({
  ...serviceDetails[path],
  path,
  name,
  related,
  kind: "service",
  indexing: "public",
  eyebrow: "BoomoTech service",
  visual: serviceVisuals[path],
}));

export const serviceByPath = new Map(services.map((record) => [record.path, record]));
