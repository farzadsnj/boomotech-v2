import type { HubPage, InfoPage } from "./types";

export const hubPages: HubPage[] = [
  { kind: "services-hub", path: "/services", eyebrow: "Services", title: "Start with the outcome you need", description: "Explore practical support, stronger foundations and focused digital work. Service boundaries are confirmed before any engagement begins.", metaDescription: "Explore BoomoTech IT support, cloud, cybersecurity, automation, web and digital services for Australian businesses and individuals." },
  { kind: "solutions-hub", path: "/solutions", eyebrow: "Solutions", title: "Technology choices shaped around your situation", description: "Begin with the people, work and friction involved, then connect the services that can help.", metaDescription: "Explore technology solutions organised around small business, professional services, retail, home office and remote work needs." },
];

const info = (record: Omit<InfoPage, "kind"> & { kind?: InfoPage["kind"] }): InfoPage => ({ ...record, kind: record.kind ?? "info" });

export const infoPages: InfoPage[] = [
  info({
    kind: "support", path: "/support", eyebrow: "Support", title: "Choose the right support starting point",
    description: "Start with what is affected, then use the safest path for an IT problem, account issue, device, network, backup or security concern.",
    metaDescription: "Choose a safe BoomoTech support pathway for IT, Microsoft 365, devices, networks, backups and security concerns.",
    notice: { tone: "safety", title: "Keep sensitive information private", body: "Never send passwords, MFA codes, recovery keys, full payment-card details or confidential customer information. A booking request starts a conversation; it is not an emergency channel, support ticket, guaranteed response or confirmed appointment." },
    cards: [
      { title: "General IT problem", description: "Start with device, printer, software or recurring day-to-day issues.", href: "/services/it-support", action: "Explore IT support" },
      { title: "Microsoft 365 or account", description: "Review account access, email, collaboration and administration needs.", href: "/services/microsoft-365", action: "Explore Microsoft 365" },
      { title: "Network or Wi-Fi", description: "Prepare details about coverage, reliability, internet access and affected areas.", href: "/services/network-wifi", action: "Explore network help" },
      { title: "Backup or recovery", description: "Clarify what is missing, what copies may exist and whether devices are still changing.", href: "/services/backup-recovery", action: "Explore recovery planning" },
      { title: "Cybersecurity concern", description: "Use a known-safe device where possible and avoid sharing credentials or sensitive files.", href: "/services/cybersecurity", action: "Review security support" },
      { title: "Project or consultation", description: "Discuss a planned setup, improvement, website, software or automation opportunity.", href: "/booking", action: "Request a consultation" }
    ],
    sections: [
      { title: "Prepare a useful problem summary", items: ["What is affected", "When it started", "The exact safe error message", "How many users are affected", "Whether work can continue", "Device and operating system if known", "Your general location", "Whether internet access still works"] },
      { title: "Remote or onsite assessment", description: "Remote support may suit account, software and configuration issues when the device can connect safely. Onsite assessment may be more appropriate for cabling, equipment, coverage or issues that prevent remote access. Suitability, service area and availability are confirmed only after review." }
    ],
    faqs: [
      { question: "What issues can BoomoTech help with?", answer: "BoomoTech can review common device, software, Microsoft 365, network, backup and security concerns, as well as planned technology improvements. Scope is confirmed before work begins." },
      { question: "Is remote or onsite support more suitable?", answer: "Remote help may suit connected devices, accounts and software. Physical equipment, cabling and coverage issues may need onsite assessment. The safest suitable path depends on the situation." },
      { question: "Does a booking request confirm an appointment?", answer: "No. It sends information for review. Availability and next steps must still be discussed." },
      { question: "What information should I prepare?", answer: "Describe what is affected, when it started, the safe error text, how many people are affected and whether work or internet access can continue." },
      { question: "What should I never share?", answer: "Never send passwords, MFA codes, recovery keys, full card details or confidential customer information." },
      { question: "Can BoomoTech help before I buy equipment?", answer: "A consultation can compare requirements and compatibility before a purchase, without assuming a specific product is suitable." },
      { question: "Can a small business request ongoing IT support?", answer: "You can request a discussion about ongoing needs. Plan scope, hours, prices and response expectations have not yet been approved." },
      { question: "What if another specialist is required?", answer: "The review may recommend an appropriate specialist or vendor pathway when the issue falls outside the agreed scope." },
      { question: "Are pricing and response times confirmed?", answer: "No. Pricing, availability and response commitments are confirmed only after the request and scope are reviewed." },
      { question: "Does BoomoTech support customers outside Brisbane?", answer: "Remote options may be suitable across Australia. Onsite area and travel terms still require owner confirmation." }
    ],
    related: [{ label: "Remote support guidance", href: "/support/remote" }, { label: "Onsite support guidance", href: "/support/onsite" }, { label: "Support safety", href: "/support/safety" }, { label: "Explore all services", href: "/services" }],
    cta: { label: "Request support or a consultation", href: "/booking", description: "Share a safe summary for review. A request does not confirm an appointment or response time." }
  }),
  info({ kind: "support", path: "/support/remote", eyebrow: "Support", title: "What remote support involves", description: "Remote help can be useful for software, account and configuration issues when it can be provided safely.", metaDescription: "Learn how BoomoTech remote support is intended to work and how to prepare safely.", notice: { tone: "safety", title: "Stay in control", body: "Never send passwords, MFA codes or recovery keys. Remote access must be explained, consented to for that session, and ended when the agreed work is complete." }, sections: [{ title: "A safe remote session", items: ["Starts with a description of the issue and agreed scope", "Uses an approved access method only when needed", "Keeps you informed about actions being taken", "Stops if identity, consent or the requested action is unclear"] }, { title: "Remote support may not suit", items: ["Hardware that will not power on", "Cabling, physical damage or Wi-Fi coverage assessment", "A suspected active scam or unsafe third-party access", "Any request that depends on sharing a secret"] }], related: [{ label: "Support safety", href: "/support/safety" }, { label: "Onsite support", href: "/support/onsite" }, { label: "IT support service", href: "/services/it-support" }] }),
  info({ kind: "support", path: "/support/onsite", eyebrow: "Support", title: "When onsite support may help", description: "Physical equipment, cabling, coverage and multi-device issues can benefit from seeing the environment directly.", metaDescription: "Learn when onsite IT support may be appropriate and what to prepare for a visit.", notice: { tone: "draft", title: "Service area is not confirmed", body: "Onsite radius, availability, travel fees and appointment terms remain unconfirmed. You can request a consultation about onsite work, but the request does not confirm a visit." }, sections: [{ title: "Common onsite considerations", items: ["Network and Wi-Fi coverage across a space", "Physical device, printer or cabling problems", "Several affected devices or shared equipment", "Setup and migration work that needs local access"] }, { title: "Before a visit", items: ["Back up important data where possible", "Make sure an authorised person can approve changes", "List affected devices without sending credentials", "Keep vendor and building-access details available"] }], related: [{ label: "Network and Wi-Fi", href: "/services/network-wifi" }, { label: "Support safety", href: "/support/safety" }, { label: "Contact options", href: "/contact" }] }),
  info({ kind: "support", path: "/support/safety", eyebrow: "Support safety", title: "Protect your accounts, data and device", description: "A legitimate support process should be clear about identity, consent, access and the information it needs.", metaDescription: "Essential safety guidance for passwords, remote access, scams, backups and IT support requests.", notice: { tone: "safety", title: "Never share a secret", body: "Do not submit or send passwords, MFA codes, recovery keys, private encryption keys or full payment-card details. If someone pressures you to act immediately, stop and verify who they are through an independent channel." }, sections: [{ title: "Before support", items: ["Back up important data when the device is stable enough", "Close private documents and unrelated applications", "Describe symptoms without including personal or confidential content", "Verify the support contact and agreed scope"] }, { title: "During remote access", items: ["Stay present and ask what is being changed", "Do not approve unexpected payments or banking access", "Stop the session if actions fall outside the agreed work", "End the tool and remove unattended access when finished"] }, { title: "If you suspect a scam", items: ["Disconnect unexpected remote-access software", "Contact your bank directly if financial information may be affected", "Change exposed credentials from a trusted device", "Seek appropriate official or specialist advice"] }] }),

  info({ kind: "booking", path: "/book", eyebrow: "Consultation", title: "Choose the conversation you need", description: "Review consultation types, prepare useful context and send a booking request when you are ready.", metaDescription: "Explore BoomoTech consultation, remote support, onsite support and project discovery appointment types.", notice: { tone: "info", title: "Request before scheduling", body: "You may send a booking request, but availability, duration, pricing, deposits, rescheduling and cancellation rules remain unapproved. A request does not reserve an appointment." }, cards: [{ title: "Technology consultation", description: "Discuss a decision, improvement opportunity or unclear technology problem." }, { title: "Remote support", description: "Prepare a focused conversation about an issue that may be handled remotely." }, { title: "Onsite support", description: "Explore whether a physical assessment is appropriate for the problem." }, { title: "Project discovery", description: "Shape a website, software, cloud or automation idea into a clearer brief." }], related: [{ label: "Consultation", href: "/book/consultation" }, { label: "Remote support", href: "/book/remote-support" }, { label: "Onsite support", href: "/book/onsite-support" }, { label: "Project discovery", href: "/book/project-discovery" }] }),
  info({ kind: "booking", path: "/book/consultation", eyebrow: "Appointment type", title: "Technology consultation", description: "A focused conversation to understand a decision, problem or improvement opportunity.", metaDescription: "Prepare for a BoomoTech technology consultation about systems, support, buying decisions or improvement priorities.", notice: { tone: "draft", title: "Appointment details pending", body: "Duration, price, availability and meeting method remain unconfirmed. No appointment is reserved from this page." }, sections: [{ title: "Useful preparation", items: ["The outcome or decision you need help with", "Who uses the system and what is not working well", "Known constraints such as deadlines, tools or budget range", "Any supplier information that is safe to share"] }, { title: "A consultation can help", items: ["Clarify options before buying technology", "Prioritise competing improvements", "Identify discovery needed for a project", "Decide whether specialist help is required"] }], related: [{ label: "Explore services", href: "/services" }, { label: "Project discovery", href: "/book/project-discovery" }] }),
  info({ kind: "booking", path: "/book/remote-support", eyebrow: "Appointment type", title: "Remote support preparation", description: "Gather safe, useful information for an issue that may be diagnosed without an onsite visit.", metaDescription: "Prepare safely for a potential BoomoTech remote IT support session.", notice: { tone: "safety", title: "Do not include credentials", body: "Never send passwords, MFA codes, recovery keys or full payment-card information. The support-ticket and appointment-scheduling workflows remain inactive. You may still send a consultation request without including credentials." }, sections: [{ title: "Prepare", items: ["Device type and operating system if known", "The exact task you were trying to complete", "A safe description of messages shown", "Whether the device can connect to the internet"] }], related: [{ label: "How remote support works", href: "/support/remote" }, { label: "Support safety", href: "/support/safety" }] }),
  info({ kind: "booking", path: "/book/onsite-support", eyebrow: "Appointment type", title: "Onsite support preparation", description: "Consider whether the environment, equipment or number of affected devices makes an onsite assessment useful.", metaDescription: "Prepare for a potential BoomoTech onsite support visit while service area and terms are being confirmed.", notice: { tone: "draft", title: "Onsite terms pending", body: "Service radius, travel fees, appointment duration, availability and cancellation rules remain unconfirmed." }, sections: [{ title: "Prepare", items: ["General location and site-access requirements", "Affected devices and physical areas", "Whether cabling or building equipment may be involved", "An authorised contact who can approve changes"] }], related: [{ label: "Onsite support guidance", href: "/support/onsite" }, { label: "Network and Wi-Fi", href: "/services/network-wifi" }] }),
  info({ kind: "booking", path: "/book/project-discovery", eyebrow: "Appointment type", title: "Project discovery", description: "Turn a broad idea into a clearer problem statement, scope and next decision.", metaDescription: "Prepare for project discovery for a website, software, cloud, automation or digital experience initiative.", notice: { tone: "draft", title: "Discovery terms pending", body: "Session format, duration, price and availability remain unconfirmed. This page offers preparation guidance only." }, sections: [{ title: "Bring the useful context", items: ["The people and workflow affected", "The problem or opportunity in plain language", "Existing tools, constraints and dependencies", "What a useful first outcome would look like"] }, { title: "Discovery outputs may include", items: ["A refined problem statement", "Prioritised user and business needs", "Scope options and unanswered questions", "A recommendation for the next reviewable stage"] }], related: [{ label: "Web and software", href: "/services/web-software" }, { label: "AI and automation", href: "/services/ai-automation" }, { label: "UI, UX and branding", href: "/services/ui-ux-branding" }] }),

  info({
    kind: "resource", path: "/resources", eyebrow: "Practical resources", title: "Prepare well and choose a clearer next step", description: "Use concise checklists and reviewed articles to describe a problem, reduce common risks and plan a useful technology conversation.", metaDescription: "Practical BoomoTech checklists and guides for IT support, Wi-Fi, Microsoft 365, backups, cybersecurity, websites and technology buying.",
    notice: { tone: "info", title: "Guidance with clear limits", body: "These resources support preparation and general education. They do not replace situation-specific technical, security or legal advice." },
    resources: [
      { featured: true, topic: "Small-business IT", format: "Checklist", readTime: "8 min read", title: "Small-business technology health check", description: "Review devices, accounts, backups, security, email, Wi-Fi and documentation in one practical sequence.", href: "/blog/essential-it-support-checklist-small-business", relatedService: "IT support", action: "Read the checklist" },
      { topic: "Support", format: "Checklist", readTime: "3 min read", title: "IT support request checklist", description: "Collect safe details about the issue, its impact and the affected setup before requesting help.", href: "/support", relatedService: "IT support", action: "Prepare a request" },
      { topic: "Support safety", format: "Checklist", readTime: "3 min read", title: "Remote support safety checklist", description: "Know what to verify, what never to share and how to keep control of a remote session.", href: "/support/safety", relatedService: "IT support", action: "Review safety" },
      { topic: "Connectivity", format: "Guide", readTime: "7 min read", title: "Wi-Fi problem preparation guide", description: "Map weak areas, affected devices and likely interference before changing equipment.", href: "/blog/improve-small-business-wifi-network", relatedService: "Network and Wi-Fi", action: "Read the guide" },
      { topic: "Accounts", format: "Checklist", readTime: "4 min read", title: "Microsoft 365 account checklist", description: "Review account ownership, access changes, MFA and recovery paths before an administration project.", href: "/services/microsoft-365", relatedService: "Microsoft 365", action: "Review the service" },
      { topic: "Resilience", format: "Checklist", readTime: "4 min read", title: "Backup readiness checklist", description: "Clarify what is protected, who checks it and how a restore would be tested.", href: "/services/backup-recovery", relatedService: "Backup and recovery", action: "Review backup planning" },
      { topic: "Security", format: "Article", readTime: "8 min read", title: "Cybersecurity basics for small businesses", description: "Work through MFA, password managers, updates, phishing awareness, backups and access limits.", href: "/blog/practical-cybersecurity-steps-australian-small-businesses", relatedService: "Cybersecurity", action: "Read the article" },
      { topic: "Web projects", format: "Guide", readTime: "5 min read", title: "Website project brief", description: "Describe the audience, goal, content, required actions and operational constraints before discovery.", href: "/book/project-discovery", relatedService: "Web and software", action: "Prepare a project" },
      { topic: "Buying advice", format: "Checklist", readTime: "4 min read", title: "Technology buying checklist", description: "Compare compatibility, setup, support, warranty and whole-of-use needs before choosing equipment.", href: "/shop", relatedService: "Technology consultation", action: "Explore sample products" },
      { topic: "Automation", format: "Checklist", readTime: "5 min read", title: "AI automation opportunity checklist", description: "Identify repetitive work, decision points, sensitive data and the human review that should remain.", href: "/services/ai-automation", relatedService: "AI and automation", action: "Explore automation" }
    ], related: [{ label: "Browse all articles", href: "/blog" }, { label: "Frequently asked questions", href: "/faq" }, { label: "Explore services", href: "/services" }]
  }),
  info({ kind: "info", path: "/faq", eyebrow: "FAQ", title: "Common questions, answered carefully", description: "Current answers explain the intended service experience without inventing operational commitments.", metaDescription: "Frequently asked questions about BoomoTech services, support, appointments, privacy and project preparation.", faqs: [{ question: "Where does BoomoTech provide help?", answer: "BoomoTech is Brisbane-based and intends to offer remote options across Australia where suitable. The onsite service radius is not yet confirmed." }, { question: "Can I book or submit a support ticket now?", answer: "You can send a consultation request through the secure booking-request form. It does not confirm an appointment. A separate support-ticket workflow remains inactive until its operational and privacy requirements are approved." }, { question: "Do prices or response times apply?", answer: "No prices, service-level agreements or response commitments are published because they have not been approved." }, { question: "What should I never send?", answer: "Never send passwords, MFA codes, recovery keys, private encryption keys or full payment-card details." }, { question: "Can I ask about a project before the scope is clear?", answer: "Yes. The consultation and project-discovery pages explain useful context, and the secure booking-request form can start the conversation." }] }),
  info({ path: "/about", eyebrow: "About BoomoTech", title: "Practical technology, explained clearly", description: "BoomoTech helps small businesses and individuals resolve everyday technology problems, strengthen their setup and plan useful digital improvements.", metaDescription: "Meet BoomoTech founder Farzad Sanjarani and learn about the practical, clear approach to IT support and digital systems.", cards: [{ title: "Resolve everyday problems", description: "Start with what is affecting the person or the work, then identify a safe practical path." }, { title: "Improve reliability and security", description: "Prioritise understandable foundations across devices, accounts, networks, backups and access." }, { title: "Build useful digital tools", description: "Shape websites, software and automation around a defined need and responsible human review." }], sections: [{ title: "Meet the founder", description: "Farzad Sanjarani is a Brisbane-based IT professional with a Master of Information Technology in Software Development from QUT. His practical background spans IT support, endpoint deployment, networking, Microsoft 365, cloud, websites, software and automation, supporting both technical and non-technical users." }, { title: "Why BoomoTech exists", description: "Technology help should make the next decision easier to understand. BoomoTech aims to connect hands-on problem solving with thoughtful improvements, without unnecessary jargon or pressure." }, { title: "How work is approached", items: ["Listen to the problem and its impact before choosing a tool", "Explain options, dependencies and boundaries in plain language", "Use safe support practices and never request secrets through forms", "Agree scope and practical outcomes before work begins", "Help customers make better purchasing and project decisions"] }, { title: "Brisbane and remote-service context", description: "BoomoTech is based in Brisbane. Remote options may be suitable across Australia, while onsite scope, service area, availability and operating details are confirmed case by case and still require owner approval." }], related: [{ label: "Explore services", href: "/services" }, { label: "Request a consultation", href: "/booking" }], cta: { label: "Request a consultation", href: "/booking", description: "Describe the problem, decision or project you want to discuss. A request does not confirm an appointment." } }),
  info({ path: "/contact", eyebrow: "Contact", title: "Prepare a useful first conversation", description: "Use the secure booking-request form to start a conversation, or prepare the context that will make a future contact useful.", metaDescription: "Prepare to contact BoomoTech about IT support, a consultation or a digital project.", notice: { tone: "info", title: "Secure booking requests are available", body: "The booking-request form collects and transmits the details shown on that form to the configured BoomoTech notification service. It does not confirm an appointment. Public phone and direct email channels remain unconfirmed." }, cards: [{ title: "For an IT issue", description: "Note what is affected, when it started and how work is impacted—without including secrets." }, { title: "For a project", description: "Describe the people, problem, current process and the outcome you want." }, { title: "For advice", description: "Bring the decision, constraints and options you are already considering." }], related: [{ label: "Support guidance", href: "/support" }, { label: "Consultation options", href: "/book" }, { label: "Quote preparation", href: "/get-a-quote" }] }),
  info({ path: "/get-a-quote", eyebrow: "Project preparation", title: "Prepare a clearer quote request", description: "Good estimates depend on useful context. Prepare the details below, then use the booking-request form to start a project conversation.", metaDescription: "Learn what information helps BoomoTech prepare a useful technology service or project quote.", notice: { tone: "info", title: "Formal quotes follow scope clarification", body: "The booking-request form can collect an initial project description. It does not generate a quote, approve scope or create a price commitment." }, process: [{ number: "01", title: "Describe the outcome", description: "Explain what needs to improve and who it affects." }, { number: "02", title: "Share safe context", description: "List systems, constraints and timing without credentials or private customer data." }, { number: "03", title: "Clarify the next stage", description: "Some requests need discovery before scope and estimates can be responsible." }], sections: [{ title: "Helpful inputs", items: ["Problem or outcome in plain language", "People, locations and systems involved", "Known dependencies and constraints", "Timing needs and a realistic budget range if available", "Who can approve scope and decisions"] }], related: [{ label: "Project discovery", href: "/book/project-discovery" }, { label: "Explore services", href: "/services" }] }),
  info({
    kind: "legal",
    path: "/privacy",
    eyebrow: "Privacy policy",
    title: "Privacy policy",
    description: "How BoomoTech collects, uses, stores and shares personal information when you use our website, accounts, service requests and AI service assistant.",
    metaDescription: "Read the BoomoTech privacy policy covering accounts, service requests, email delivery, AI chat, security, overseas processing and privacy rights.",
    notice: {
      tone: "info",
      title: "Last updated 6 October 2026",
      body: "This policy describes BoomoTech's current information-handling practices and applies Australian privacy law, including the Privacy Act 1988 (Cth), where it applies. Please do not submit passwords, MFA codes, recovery keys, private keys, full payment-card details or unrelated confidential information."
    },
    sections: [
      {
        title: "Who we are and how to contact us",
        description: "BoomoTech is a Brisbane-based technology services business providing IT support, networking, cloud, cybersecurity, websites, software, automation and related consultation. Privacy questions, access or correction requests, deletion requests and complaints can be sent through the BoomoTech Contact page. Include the word 'Privacy' so the request can be identified."
      },
      {
        title: "Personal information we collect",
        items: [
          "Account information such as your name and email address, together with password hashes, session records, security timestamps and related authentication records. BoomoTech does not store your plaintext account password.",
          "Service and booking information such as your name, email address, phone number, selected service, request description, request status, messages exchanged about the request and internal service notes used to manage the request.",
          "AI service-assistant content when you choose to ask an AI question, including your current question and a limited number of recent in-memory chat turns needed to provide context.",
          "Technical and security information such as IP or trusted forwarded client address, browser or user-agent information, request timing, rate-limit records, application logs, Nginx logs and security events.",
          "Email-delivery information required for account verification, password recovery, booking notifications and request communication."
        ]
      },
      {
        title: "How we collect and use information",
        items: [
          "Information is collected directly from you when you create an account, sign in, submit a booking or service request, reply to a request, use password recovery, contact BoomoTech or ask the AI service assistant a question.",
          "Technical information is collected automatically when the website and security controls receive a request.",
          "We use information to provide and secure accounts, receive and manage service requests, communicate with you, prevent abuse, troubleshoot the service, maintain backups, respond to privacy requests and meet applicable legal obligations.",
          "BoomoTech does not sell personal information and does not currently use the website for behavioural advertising."
        ]
      },
      {
        title: "Service providers and overseas processing",
        description: "Some service providers may process information outside Australia. Where practicable, BoomoTech limits the information sent to each provider to what is needed for that function.",
        items: [
          "OpenAI is used for the optional AI service assistant. The server sends the question and limited recent chat context to the OpenAI API. The integration requests no application-state storage. OpenAI states that API inputs and outputs are not used to train its models by default unless an organisation explicitly opts in, and standard abuse-monitoring logs may be retained for up to 30 days. Processing may occur outside Australia, including in the United States.",
          "Resend is used to deliver verification, password-reset, booking and request-related email. Email addresses, message content and delivery metadata may be processed and stored in the United States under Resend's service terms and data-processing arrangements.",
          "Cloudflare is used for DNS, secure tunnelling and network/security delivery. Cloudflare may process network identifiers such as IP addresses and request metadata through its global infrastructure.",
          "Other suppliers may be introduced only when required for an approved service. This policy will be updated when a change materially affects how personal information is handled."
        ]
      },
      {
        title: "AI service assistant",
        description: "The AI assistant provides general guidance about BoomoTech's published services. It is not used to make eligibility, employment, credit, legal, medical or other decisions that significantly affect a person's rights or interests. Account records, private booking conversations and administrator-only notes are not intentionally supplied to the AI assistant. Service decisions and customer requests remain subject to human review."
      },
      {
        title: "Cookies, browser storage and caching",
        description: "BoomoTech uses essential cookies and limited browser storage for secure sign-in and site preferences. The website does not currently intentionally set analytics, advertising or cross-site marketing cookies. Details, storage names and browser choices are explained in the Cookies, browser storage and cache policy.",
        items: [
          "Authentication cookies are necessary to keep signed-in sessions working securely.",
          "Local and session storage are used for small interface preferences such as chatbot sound and whether a welcome message has already been shown.",
          "Browsers may cache public static files such as styles, scripts, fonts and images. Sensitive account, administrator and API routes are sent with no-store cache instructions.",
          "If non-essential analytics or marketing technology is introduced later, BoomoTech will update the policy and implement appropriate notice and consent controls before enabling it."
        ]
      },
      {
        title: "Retention and backups",
        description: "Personal information is kept only for as long as reasonably needed for the purpose it was collected, operational security, dispute handling and applicable legal or accounting obligations. Account and request records may remain while an account or service relationship is active. Server backups can continue to contain earlier copies until the normal backup rotation expires. The current operational backup rotation is designed to retain up to 7 daily, 4 weekly and 3 monthly copies. Third-party providers apply their own documented retention settings and legal requirements."
      },
      {
        title: "Security",
        items: [
          "Production traffic uses HTTPS and server-side secrets are kept out of the browser and source-control environment files.",
          "Passwords are stored as one-way password hashes rather than plaintext, and production authentication cookies use secure settings.",
          "Access to customer requests and administrator functions is restricted by authenticated user identity and role checks.",
          "Backups and production configuration are protected with restricted filesystem permissions and are intended to be tested through isolated restore procedures.",
          "No internet service can guarantee absolute security. If BoomoTech becomes aware of a security incident, it will assess and respond to it in line with applicable obligations."
        ]
      },
      {
        title: "Access, correction and deletion requests",
        description: "You may ask BoomoTech what personal information it holds about you, request correction of inaccurate information, or request deletion where appropriate. Use the Contact page and identify the request as a privacy matter. BoomoTech may need to verify identity before disclosing or changing account information. Some records may need to be retained where required by law, for security, or to establish or defend legal rights."
      },
      {
        title: "Privacy complaints",
        description: "Send a privacy complaint through the Contact page with enough information to understand the concern, but do not include passwords or other secrets. BoomoTech will review the complaint and respond with the outcome or the next reasonable step. If the issue is not resolved and applicable Australian privacy law provides that option, you may also contact the Office of the Australian Information Commissioner."
      },
      {
        title: "Changes to this policy",
        description: "BoomoTech will update this page when information-handling practices materially change. The date at the top of the policy shows the latest published update. Material changes affecting an existing service may also be communicated through the relevant account or service channel."
      }
    ],
    related: [
      { label: "Cookies, browser storage and cache", href: "/cookies" },
      { label: "Contact BoomoTech", href: "/contact" },
      { label: "Support safety", href: "/support/safety" }
    ]
  }),
  info({
    kind: "legal",
    path: "/cookies",
    eyebrow: "Browser privacy",
    title: "Cookies, browser storage and cache",
    description: "What BoomoTech stores in your browser, why it is needed and how browser caching is handled.",
    metaDescription: "Read how BoomoTech uses essential cookies, local storage, session storage and browser cache, with no current analytics or advertising cookies.",
    notice: {
      tone: "info",
      title: "Essential and functional storage only",
      body: "BoomoTech does not currently intentionally use analytics, advertising or cross-site marketing cookies. The notice shown on the website explains current browser storage; the acknowledgement button is not consent to marketing tracking."
    },
    sections: [
      {
        title: "Essential authentication cookies",
        description: "Signed-in customer and administrator areas require authentication cookies so the server can recognise a valid session. These cookies are necessary for account security and protected areas of the website. Blocking them may prevent registration, sign-in, dashboards and other authenticated functions from working correctly."
      },
      {
        title: "Local and session storage",
        items: [
          "boomotech-chat-sound stores whether you turned the optional chatbot sound on or off.",
          "boomotech-welcome-seen records for the current browser session that the chatbot welcome message has already been shown.",
          "boomotech-chat-sound-played records for the current browser session that the optional sound has already played.",
          "boomotech-cookie-notice-seen stores that you have dismissed the privacy and browser-storage notice so it does not need to appear on every page."
        ]
      },
      {
        title: "Browser cache",
        description: "Your browser may cache public static website files such as images, fonts, stylesheets and scripts to improve performance. BoomoTech does not intentionally place booking-form content, account data or AI-chat history into a persistent browser cache. Sensitive account, administrator and API routes are configured with no-store cache instructions. Browser history and cache behaviour can still vary by browser and device."
      },
      {
        title: "Security and infrastructure cookies",
        description: "Infrastructure and security providers such as Cloudflare may set strictly necessary cookies or similar identifiers when required for security, abuse prevention, network delivery or challenge verification. These are not used by BoomoTech for behavioural advertising."
      },
      {
        title: "Your choices",
        items: [
          "You can clear or block cookies, local storage and cached files using your browser settings.",
          "Blocking essential authentication storage can stop signed-in features from working.",
          "You can change the chatbot sound from the chatbot interface without changing any advertising preference.",
          "Because BoomoTech does not currently intentionally use non-essential analytics or marketing cookies, there is no 'accept all' advertising-cookie control."
        ]
      },
      {
        title: "Future analytics or marketing technology",
        description: "If BoomoTech later introduces non-essential analytics, advertising, tracking pixels or similar technologies, those tools will be reviewed before launch. This page and the Privacy Policy will be updated, and appropriate consent or preference controls will be implemented before non-essential tracking is enabled where required."
      },
      {
        title: "More information",
        description: "For how personal information is collected, used, disclosed, secured, retained and accessed, read the Privacy Policy. Privacy questions can be submitted through the Contact page."
      }
    ],
    related: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Contact BoomoTech", href: "/contact" }
    ]
  }),
  info({ kind: "legal", path: "/terms", eyebrow: "Draft terms", title: "Website and service terms", description: "This page is a structural placeholder and does not create approved service terms.", metaDescription: "BoomoTech website and service terms placeholder pending owner and legal review.", notice: { tone: "draft", title: "Owner and legal review required", body: "Legal entity details, service scope, payment, cancellations, acceptable use, warranties, liability and dispute terms are not approved." }, sections: [{ title: "The final terms must address", items: ["Website use and content limitations", "Quoting, scope and customer responsibilities", "Payments, cancellations and rescheduling", "Products, shipping, returns and refunds if commerce proceeds", "Liability, governing law and dispute handling"] }] }),
];
