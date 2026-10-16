export type PricingOption = {
  title: string;
  servicePath: `/${string}`;
  summary: string;
  includes: readonly string[];
  pricingBasis: string;
  conditions: string;
};

export const pricingOptions: readonly PricingOption[] = [
  {
    title: "Remote IT Support",
    servicePath: "/services/it-support",
    summary: "Focused help for suitable device, software, account and configuration problems.",
    includes: ["Initial problem review", "Agreed remote troubleshooting scope", "Plain-language next steps"],
    pricingBasis: "Request a scoped quote",
    conditions: "Remote access is used only when suitable, explained and agreed. A request does not confirm availability.",
  },
  {
    title: "Onsite IT Support",
    servicePath: "/support/onsite",
    summary: "Assessment for physical equipment, cabling, coverage or multi-device issues.",
    includes: ["Suitability review", "Proposed onsite scope", "Travel requirements confirmed before agreement"],
    pricingBasis: "Quoted after location and scope review",
    conditions: "Service area, travel costs and scheduling remain subject to confirmation.",
  },
  {
    title: "Microsoft 365 Assistance",
    servicePath: "/services/microsoft-365",
    summary: "Help with account administration, email, collaboration and access foundations.",
    includes: ["Current-state review", "Agreed account or configuration work", "Safe handover notes where appropriate"],
    pricingBasis: "Quoted for the confirmed task or project",
    conditions: "Licensing and third-party subscription costs are separate unless explicitly included in a written scope.",
  },
  {
    title: "Network Troubleshooting",
    servicePath: "/services/network-wifi",
    summary: "Practical investigation of unreliable connectivity, coverage and network setup.",
    includes: ["Symptoms and environment review", "Remote or onsite assessment recommendation", "Prioritised improvement options"],
    pricingBasis: "Quoted after the environment is understood",
    conditions: "Hardware, cabling and installation are confirmed separately after compatibility and site requirements are reviewed.",
  },
  {
    title: "Website Maintenance",
    servicePath: "/services/web-software",
    summary: "Review and improvement work for an existing business website or application.",
    includes: ["Platform and issue review", "Defined maintenance scope", "Change and verification plan"],
    pricingBasis: "Project quote based on platform and scope",
    conditions: "Hosting, licences, content production and ongoing support are included only when stated in the agreed scope.",
  },
  {
    title: "IT Consultation",
    servicePath: "/book/consultation",
    summary: "A structured conversation about a technology decision, risk or improvement priority.",
    includes: ["Context and requirements review", "Options and trade-offs", "Recommended next decision"],
    pricingBasis: "Pricing confirmed before a consultation is agreed",
    conditions: "Submitting a request starts a conversation and does not reserve or confirm an appointment.",
  },
  {
    title: "Business Technology Projects",
    servicePath: "/book/project-discovery",
    summary: "Discovery and delivery planning for systems, cloud, automation, web or digital work.",
    includes: ["Problem and outcome definition", "Dependencies and constraints", "A reviewable scope or next-stage recommendation"],
    pricingBasis: "Discovery or project quote after scope clarification",
    conditions: "Final pricing depends on requirements, risk, dependencies, customer responsibilities and agreed deliverables.",
  },
] as const;

export const pricingPrinciples = [
  "The request is reviewed before scope, price or availability is confirmed.",
  "Third-party products, licences, subscriptions and travel are identified separately where relevant.",
  "Work begins only after the customer has a clear scope and pricing basis.",
  "A booking request or quote request does not create a confirmed appointment or service agreement.",
] as const;
