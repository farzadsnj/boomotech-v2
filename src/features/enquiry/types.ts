export const enquiryAudiences = ["personal", "business", "unsure"] as const;
export type EnquiryAudience = (typeof enquiryAudiences)[number];

export const enquiryCategories = [
  "it-problem", "email-accounts", "network", "security-backup", "ongoing-support",
  "website-software", "automation", "equipment-advice", "other",
] as const;
export type EnquiryCategory = (typeof enquiryCategories)[number];

export const enquiryIntents = ["support", "project", "quote", "consultation"] as const;
export type EnquiryIntent = (typeof enquiryIntents)[number];

export type PreparationAnswer = { question: string; answer: string };

export type EnquiryContext = {
  audience?: EnquiryAudience;
  category?: EnquiryCategory;
  servicePath?: string;
  serviceChoice?: "suggested" | "selected";
  intent?: EnquiryIntent;
  preparation?: PreparationAnswer[];
  description?: string;
};

export const audienceLabels: Record<EnquiryAudience, string> = {
  personal: "For personal use or a home office",
  business: "For a business",
  unsure: "Not sure yet",
};

export const categoryLabels: Record<EnquiryCategory, string> = {
  "it-problem": "A computer, printer or everyday IT problem",
  "email-accounts": "Email, Microsoft 365 or account access",
  network: "Wi-Fi, internet or network reliability",
  "security-backup": "Security, backups or lost-file concerns",
  "ongoing-support": "Ongoing IT support and maintenance",
  "website-software": "A website, software tool or digital experience",
  automation: "Repetitive administration or workflow automation",
  "equipment-advice": "Advice before buying or replacing equipment",
  other: "Not sure which category fits",
};
