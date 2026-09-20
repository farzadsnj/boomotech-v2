export type NavItem = { label: string; href: string };
export type RouteRecord = {
  href: `/${string}`;
  eyebrow: string;
  title: string;
  description: string;
  section: string;
};

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
  ] satisfies NavItem[],
  footer: [
    {
      title: "Explore",
      links: [
        { label: "Services", href: "/services" },
        { label: "Solutions", href: "/solutions" },
        { label: "Resources", href: "/resources" },
        { label: "Shop preview", href: "/shop" },
      ],
    },
    {
      title: "Get started",
      links: [
        { label: "IT support", href: "/support" },
        { label: "Book a consultation", href: "/book" },
        { label: "Request a quote", href: "/get-a-quote" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Information",
      links: [
        { label: "About", href: "/about" },
        { label: "FAQ", href: "/faq" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
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
    {
      number: "01",
      title: "I need help with an IT problem",
      description: "Find a clear starting point for devices, accounts, networks and everyday tech issues.",
      href: "/support",
      action: "Explore support",
      icon: "support",
    },
    {
      number: "02",
      title: "I want to improve my business systems",
      description: "Explore practical ways to make work more reliable, secure and connected.",
      href: "/solutions",
      action: "See solutions",
      icon: "systems",
    },
    {
      number: "03",
      title: "I need a website, app or automation",
      description: "Turn an idea or repetitive process into a useful digital project.",
      href: "/services/web-software",
      action: "Explore digital services",
      icon: "build",
    },
    {
      number: "04",
      title: "I want advice before buying technology",
      description: "Understand your options before choosing tools, devices or a new platform.",
      href: "/book",
      action: "Plan a consultation",
      icon: "advice",
    },
  ],
  serviceGroups: [
    {
      number: "01 / SUPPORT",
      title: "Keep the essentials working",
      description: "Help with IT support, Microsoft 365, networks and the systems you depend on.",
      links: [
        { label: "IT support", href: "/services/it-support" },
        { label: "Microsoft 365", href: "/services/microsoft-365" },
        { label: "Network and Wi-Fi", href: "/services/network-wifi" },
      ],
    },
    {
      number: "02 / IMPROVE",
      title: "Build a safer, stronger setup",
      description: "Explore cloud and cybersecurity foundations that suit the way you work.",
      links: [
        { label: "Cybersecurity", href: "/services/cybersecurity" },
        { label: "Cloud and infrastructure", href: "/services/cloud-infrastructure" },
      ],
    },
    {
      number: "03 / CREATE",
      title: "Make room for what is next",
      description: "Shape a website, software product or workflow improvement around a real need.",
      links: [
        { label: "AI and automation", href: "/services/ai-automation" },
        { label: "Web and software", href: "/services/web-software" },
      ],
    },
  ],
  process: [
    { number: "01", title: "Tell us what is happening", description: "Start with the problem or outcome, in your own words." },
    { number: "02", title: "Find the right path", description: "We clarify the scope and next step before work begins." },
    { number: "03", title: "Move forward with clarity", description: "Get practical recommendations suited to your situation." },
  ],
} as const;

const route = (
  href: RouteRecord["href"],
  section: string,
  title: string,
  description: string,
): RouteRecord => ({ href, eyebrow: "Page preview", section, title, description });

// These are information architecture placeholders, not published service claims.
export const phaseOneRoutes: RouteRecord[] = [
  route("/services", "Services", "Explore services", "Find a practical starting point for support, improvement or a new digital project."),
  route("/services/it-support", "Services", "IT support", "Help with everyday technology problems for businesses and individuals."),
  route("/services/microsoft-365", "Services", "Microsoft 365", "Explore setup, collaboration and administration support."),
  route("/services/network-wifi", "Services", "Network and Wi-Fi", "Explore help for reliable connectivity at work or at home."),
  route("/services/cybersecurity", "Services", "Cybersecurity foundations", "Explore sensible steps to reduce everyday technology risk."),
  route("/services/cloud-infrastructure", "Services", "Cloud and infrastructure", "Explore systems that support reliable day-to-day work."),
  route("/services/ai-automation", "Services", "AI and automation", "Explore where a better workflow could save effort while keeping people in control."),
  route("/services/web-software", "Services", "Web and software development", "Explore useful websites and software shaped around a clear brief."),
  route("/solutions", "Solutions", "Solutions for real work", "Explore technology paths organised around your situation and goals."),
  route("/solutions/small-business", "Solutions", "Small business", "Explore practical help for teams without a dedicated IT function."),
  route("/solutions/professional-services", "Solutions", "Professional services", "Explore reliable systems and clearer workflows for professional teams."),
  route("/solutions/retail", "Solutions", "Retail", "Explore connected technology needs for a retail environment."),
  route("/solutions/home-office-individuals", "Solutions", "Home offices and individuals", "Explore clear help for personal devices and home working."),
  route("/solutions/remote-work", "Solutions", "Remote work", "Explore tools and support for work across locations."),
  route("/support", "Support", "Get IT help", "A guided support request will be added after privacy, response and operational details are confirmed."),
  route("/book", "Consultation", "Book a consultation", "Appointment options will appear here after availability and booking terms are confirmed."),
  route("/shop", "Shop", "Curated technology shop", "A service-relevant product catalogue is planned for a later phase."),
  route("/resources", "Resources", "Useful technology guidance", "Guides and articles will be published after editorial review."),
  route("/blog", "Resources", "Articles", "Practical articles are being prepared for review."),
  route("/faq", "Resources", "Frequently asked questions", "Answers will be added when service scope and policies are confirmed."),
  route("/about", "About", "About BoomoTech", "BoomoTech aims to connect hands-on technology help with longer-term improvement."),
  route("/contact", "Contact", "Contact BoomoTech", "Verified contact details will be published here after owner confirmation."),
  route("/get-a-quote", "Enquiry", "Request a quote", "A secure quote request will be added after service scope and privacy rules are approved."),
  route("/privacy", "Legal", "Privacy", "Privacy information requires owner and legal review before publication."),
  route("/terms", "Legal", "Terms", "Terms require owner and legal review before publication."),
];

export const routeByPath = new Map(phaseOneRoutes.map((item) => [item.href, item]));
