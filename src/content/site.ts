import type { SiteLink } from "./types";

export const site = {
  name: "BoomoTech",
  description:
    "Practical technology support and smarter systems for your business. Brisbane-based help with remote options across Australia.",
  navigation: [
    { label: "Services", href: "/services" },
    { label: "Solutions", href: "/solutions" },
    { label: "Support", href: "/support" },
    { label: "Resources", href: "/resources" },
    { label: "About", href: "/about" },
  ] satisfies SiteLink[],
  footer: [
    {
      title: "Explore",
      links: [
        { label: "Services", href: "/services" },
        { label: "Solutions", href: "/solutions" },
        { label: "Resources", href: "/resources" },
        { label: "Shop", href: "/shop" },
      ],
    },
    {
      title: "Get started",
      links: [
        { label: "IT support", href: "/support" },
        { label: "Consultation", href: "/book" },
        { label: "Quote preparation", href: "/get-a-quote" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Information",
      links: [
        { label: "About", href: "/about" },
        { label: "FAQ", href: "/faq" },
        { label: "Privacy draft", href: "/privacy" },
        { label: "Terms draft", href: "/terms" },
      ],
    },
  ],
} as const;

// Working copy from docs/CONTENT.md. Owner approval is required before launch.
export const homeContent = {
  eyebrow: "Practical technology help",
  headline: "Practical technology support and smarter systems for your business.",
  introduction:
    "Brisbane-based assistance for day-to-day IT problems, cloud, security, websites, automation and AI — with remote options across Australia.",
  primaryAction: { label: "Get IT help", href: "/support" },
  secondaryAction: { label: "Book a consultation", href: "/book" },
  pathways: [
    { number: "01", title: "I need help with an IT problem", description: "Find a clear starting point for devices, accounts, networks and everyday tech issues.", href: "/support", action: "Explore support", icon: "support" },
    { number: "02", title: "I want to improve my business systems", description: "Explore practical ways to make work more reliable, secure and connected.", href: "/solutions", action: "See solutions", icon: "systems" },
    { number: "03", title: "I need a website, app or automation", description: "Turn an idea or repetitive process into a useful digital project.", href: "/services/web-software", action: "Explore digital services", icon: "build" },
    { number: "04", title: "I want advice before buying technology", description: "Understand your options before choosing tools, devices or a new platform.", href: "/book", action: "Plan a consultation", icon: "advice" },
  ],
  serviceGroups: [
    { number: "01 / SUPPORT", title: "Keep the essentials working", description: "Help with IT support, Microsoft 365, networks and the systems you depend on.", links: [
      { label: "IT support", href: "/services/it-support" },
      { label: "Microsoft 365", href: "/services/microsoft-365" },
      { label: "Network and Wi-Fi", href: "/services/network-wifi" },
      { label: "Backup and recovery", href: "/services/backup-recovery" },
    ] },
    { number: "02 / IMPROVE", title: "Build a safer, stronger setup", description: "Explore cloud and cybersecurity foundations that suit the way you work.", links: [
      { label: "Cybersecurity", href: "/services/cybersecurity" },
      { label: "Cloud and infrastructure", href: "/services/cloud-infrastructure" },
      { label: "Managed IT", href: "/services/managed-it" },
    ] },
    { number: "03 / CREATE", title: "Make room for what is next", description: "Shape a website, software product or workflow improvement around a real need.", links: [
      { label: "AI and automation", href: "/services/ai-automation" },
      { label: "Web and software", href: "/services/web-software" },
      { label: "Digital presence", href: "/services/digital-presence" },
      { label: "UI, UX and branding", href: "/services/ui-ux-branding" },
    ] },
  ],
  process: [
    { number: "01", title: "Tell us what is happening", description: "Start with the problem or outcome, in your own words." },
    { number: "02", title: "Find the right path", description: "We clarify the scope and next step before work begins." },
    { number: "03", title: "Move forward with clarity", description: "Get practical recommendations suited to your situation." },
  ],
} as const;
