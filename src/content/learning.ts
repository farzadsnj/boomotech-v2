export type LearningCategory = {
  title: string;
  description: string;
  relatedPath: `/${string}`;
  relatedLabel: string;
};

export const learningCategories: readonly LearningCategory[] = [
  { title: "IT Support Fundamentals", description: "Understand devices, accounts, updates and safe troubleshooting habits.", relatedPath: "/services/it-support", relatedLabel: "Explore IT support" },
  { title: "Networking Basics", description: "Learn how routers, Wi-Fi coverage, guest access and reliable connections fit together.", relatedPath: "/services/network-wifi", relatedLabel: "Explore network services" },
  { title: "Microsoft 365", description: "Build practical knowledge around accounts, email, collaboration and secure administration.", relatedPath: "/services/microsoft-365", relatedLabel: "Explore Microsoft 365" },
  { title: "Cybersecurity Awareness", description: "Develop safer habits for access, phishing, updates, backups and incident preparation.", relatedPath: "/services/cybersecurity", relatedLabel: "Explore cybersecurity" },
  { title: "Cloud Fundamentals", description: "Understand shared infrastructure, access, continuity and cloud service decisions.", relatedPath: "/services/cloud-infrastructure", relatedLabel: "Explore cloud services" },
  { title: "Python and Automation", description: "Learn how repeatable processes can be mapped and automated with responsible review.", relatedPath: "/services/ai-automation", relatedLabel: "Explore automation" },
  { title: "Website Development", description: "Learn the foundations of useful, accessible and maintainable websites.", relatedPath: "/services/web-software", relatedLabel: "Explore web services" },
] as const;

export const learningPortalStages = [
  { title: "Courses", description: "Structured learning paths will group related lessons when reviewed material is ready." },
  { title: "Lessons and quizzes", description: "Future lessons may include short knowledge checks and practical exercises." },
  { title: "Learning progress", description: "Account-based progress may be considered later after privacy and operational requirements are approved." },
] as const;
