export type LearningLink = { label: string; description: string; href: `/${string}` };
export type LearningCategory = {
  title: string;
  description: string;
  status: "available" | "planned";
  relatedPath: `/${string}`;
  relatedLabel: string;
};

export const learningNavigation: readonly LearningLink[] = [
  { label: "Learning hub", description: "Simple learning tools and practical exercises.", href: "/learning" },
  { label: "PTE Academic practice", description: "Reading and Writing practice with optional Persian help.", href: "/learning/pte-academic" },
] as const;

export const publicLearningRoutes = ["/learning/pte-academic"] as const;

export const learningCategories: readonly LearningCategory[] = [
  { title: "PTE Academic: Reading and Writing", description: "Practise seven task types with original exercises, explanations, timers and account-linked progress.", status: "available", relatedPath: "/learning/pte-academic", relatedLabel: "Explore PTE practice" },
  { title: "IT Support Fundamentals", description: "Understand devices, accounts, updates and safe troubleshooting habits.", status: "planned", relatedPath: "/services/it-support", relatedLabel: "Explore IT support" },
  { title: "Networking Basics", description: "Learn how routers, Wi-Fi coverage, guest access and reliable connections fit together.", status: "planned", relatedPath: "/services/network-wifi", relatedLabel: "Explore network services" },
  { title: "Microsoft 365", description: "Build practical knowledge around accounts, email, collaboration and secure administration.", status: "planned", relatedPath: "/services/microsoft-365", relatedLabel: "Explore Microsoft 365" },
  { title: "Cybersecurity Awareness", description: "Develop safer habits for access, phishing, updates, backups and incident preparation.", status: "planned", relatedPath: "/services/cybersecurity", relatedLabel: "Explore cybersecurity" },
  { title: "Cloud Fundamentals", description: "Understand shared infrastructure, access, continuity and cloud service decisions.", status: "planned", relatedPath: "/services/cloud-infrastructure", relatedLabel: "Explore cloud services" },
  { title: "Python and Automation", description: "Learn how repeatable processes can be mapped and automated with responsible review.", status: "planned", relatedPath: "/services/ai-automation", relatedLabel: "Explore automation" },
  { title: "Website Development", description: "Learn the foundations of useful, accessible and maintainable websites.", status: "planned", relatedPath: "/services/web-software", relatedLabel: "Explore web services" },
] as const;

export const learningPortalStages = [
  { title: "Practise without registration", description: "PTE practice starts in this browser. No account or payment is required for the initial exercise bank." },
  { title: "Review explanations", description: "Reading answers explain grammar, collocation and paragraph links, with optional Persian support." },
  { title: "Keep progress locally", description: "Drafts, attempts and settings stay in this browser profile and can be exported or reset by the learner." },
] as const;
