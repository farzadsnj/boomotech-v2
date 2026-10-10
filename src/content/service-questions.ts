import { services } from "./services";

export type ServiceMiniQuestion = { id: string; prompt: string; options: string[] };

const shared = {
  urgency: { id: "urgency", prompt: "How is this affecting you now?", options: ["Work has stopped", "Work is disrupted", "I am planning ahead"] },
  scope: { id: "scope", prompt: "Who or what is affected?", options: ["One person or device", "Several people or systems", "The wider business"] },
  stage: { id: "stage", prompt: "What stage are you at?", options: ["Exploring options", "Ready to define a scope", "Improving something existing"] },
} satisfies Record<string, ServiceMiniQuestion>;

export const serviceQuestions: Record<string, ServiceMiniQuestion[]> = {
  "/services/it-support": [shared.urgency, shared.scope, { id: "issue", prompt: "What best describes the issue?", options: ["Device or software", "Email or account", "Printer or peripheral"] }],
  "/services/managed-it": [shared.scope, shared.stage, { id: "need", prompt: "What needs the most clarity?", options: ["Day-to-day support", "Ownership and documentation", "Planned improvements"] }],
  "/services/microsoft-365": [shared.scope, { id: "area", prompt: "Which area needs attention?", options: ["Email and accounts", "Files and collaboration", "Administration and access"] }],
  "/services/cloud-infrastructure": [shared.stage, shared.scope, { id: "area", prompt: "What are you reviewing?", options: ["Cloud hosting", "Servers and infrastructure", "Reliability and management"] }],
  "/services/network-wifi": [shared.urgency, { id: "symptom", prompt: "What are you noticing?", options: ["Slow or unreliable Wi-Fi", "Coverage gaps", "A new site or network"] }],
  "/services/cybersecurity": [shared.urgency, { id: "concern", prompt: "What prompted the review?", options: ["A suspicious event", "Account or device concerns", "A planned security review"] }],
  "/services/backup-recovery": [shared.urgency, { id: "need", prompt: "What do you need help with?", options: ["Missing or lost files", "Backup setup", "Restore and recovery planning"] }],
  "/services/ai-automation": [shared.stage, { id: "work", prompt: "What kind of work could improve?", options: ["Repetitive administration", "Information handling", "A guided customer process"] }],
  "/services/web-software": [shared.stage, { id: "project", prompt: "What are you considering?", options: ["A new website", "A website improvement", "Custom software"] }],
  "/services/digital-presence": [shared.stage, { id: "priority", prompt: "What needs to become clearer?", options: ["Business information", "Customer pathways", "Content and visibility"] }],
  "/services/ui-ux-branding": [shared.stage, { id: "focus", prompt: "Where is the main opportunity?", options: ["User experience", "Interface consistency", "Digital brand direction"] }],
};

export const servicesMissingQuestions = services.filter(({ path }) => !serviceQuestions[path]);
