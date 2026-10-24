import type { ServiceRecord } from "./types";

export type ServiceDetailContent = Pick<ServiceRecord,
  "title" | "description" | "metaDescription" | "audience" | "signals" | "problems" | "inclusions" |
  "separateAgreement" | "delivery" | "outcomes" | "diagram" | "example" | "process" | "processTitle" |
  "ctaLabel" | "ctaTitle" | "preparation" | "faqs"
>;

export const serviceDetails: Record<ServiceRecord["path"], ServiceDetailContent> = {
  "/services/it-support": {
    title: "Practical IT support when everyday technology gets in the way",
    description: "Get help investigating device, software, email and printer problems, with clear advice on the next step.",
    metaDescription: "Practical IT support for device, software, email and printer problems, with remote and onsite pathways reviewed before work begins.",
    audience: "For small businesses, professionals, home offices and individuals who need a technology problem assessed without having to diagnose it first.",
    signals: ["A computer has become slow or unreliable", "Software errors keep returning", "A printer or peripheral interrupts work", "Email or account access is stopping a task"],
    problems: [
      { title: "A device slows down or fails unexpectedly", description: "Long start-up times, freezing or recurring errors interrupt work and may have several possible causes." },
      { title: "Software or account access blocks a task", description: "An application error, sign-in problem or configuration change can stop routine work." },
      { title: "Printers and peripherals behave inconsistently", description: "Connection, driver, queue or network issues can make a simple fault difficult to isolate." },
      { title: "A temporary fix does not last", description: "Repeated restarts or workarounds can hide the underlying issue and create more disruption later." },
    ],
    inclusions: ["Clarifying symptoms, impact and recent changes", "Safe remote-access suitability assessment", "Agreed device, software, email and peripheral troubleshooting", "Verification with the person affected", "Plain-language notes and recommendations"],
    separateAgreement: ["Onsite attendance, location and travel arrangements", "Replacement hardware, licences and vendor charges", "Specialist repair, data recovery or vendor escalation"],
    delivery: "Remote troubleshooting may suit accessible software, account and configuration issues. Hardware, cabling, physical damage or problems that prevent safe access may require onsite assessment or a specialist. Suitability and availability are confirmed after review.",
    outcomes: ["A clearer explanation of the likely cause", "An agreed fix, workaround or escalation path", "Verification that the original task can be completed", "Notes for reducing repeat disruption where practical"],
    diagram: { kind: "flow", title: "Choose the right support path", caption: "The issue is described first. Remote work is used only when access is safe and suitable; physical or inaccessible faults may need onsite assessment.", stages: [
      { label: "Describe the issue", detail: "Device, symptoms, impact and recent changes" }, { label: "Assess safe access", detail: "Confirm whether remote work is appropriate" }, { label: "Choose the path", options: ["Remote troubleshooting", "Onsite assessment"] }, { label: "Verify and explain", detail: "Test the result and document the next step" },
    ] },
    example: { situation: "A staff laptop becomes slow after sign-in, Outlook disconnects and the shared office printer disappears.", assessment: "Review symptom timing, device health, account status, recent updates and the printer connection before choosing remote or onsite support.", deliverables: ["A documented diagnosis or narrowed cause", "Agreed troubleshooting and verification", "Escalation or replacement advice when the fault is outside scope"] },
    process: [
      { number: "01", title: "Describe the problem", description: "Share the device, symptoms, impact, error wording and recent changes without sending passwords or codes." },
      { number: "02", title: "Choose a safe support path", description: "Confirm whether remote access is suitable or the issue needs physical inspection or another specialist." },
      { number: "03", title: "Troubleshoot the agreed scope", description: "Work through likely causes in a controlled order and explain changes before making them." },
      { number: "04", title: "Verify and hand over", description: "Check the original task, record what changed and explain remaining risk or follow-up." },
    ],
    processTitle: "From symptoms to a verified next step", ctaLabel: "Request IT support", ctaTitle: "Tell us what is getting in the way.",
    preparation: "Include the device type, operating system if known, exact error wording, when the issue started, who is affected and whether work has stopped.",
    faqs: [
      { question: "What information should I provide?", answer: "Describe the device, task, exact symptom or error, when it began, who is affected and any recent change. Do not include passwords, MFA codes or recovery keys." },
      { question: "Can you help remotely?", answer: "Some software, account and configuration issues may suit remote support after safe access and consent are confirmed." },
      { question: "When is onsite support needed?", answer: "Physical faults, cabling, installation, inaccessible devices or issues that cannot be assessed safely online may need onsite review. Location and availability must be confirmed." },
      { question: "What if the issue needs another specialist?", answer: "BoomoTech can explain the boundary and provide findings for a repairer, vendor, internet provider or another appropriate specialist. Their work requires separate agreement." },
    ],
  },
  "/services/managed-it": {
    title: "Give your business IT a clear owner and a practical plan",
    description: "Create a more consistent approach to maintenance, user changes, documentation and ongoing technology needs.",
    metaDescription: "Managed IT planning for clearer ownership, maintenance routines, documentation, user changes and prioritised improvements.",
    audience: "For growing organisations where technology tasks are shared informally and important routines need clearer ownership.",
    signals: ["Support is mostly reactive", "Joiners and leavers are handled differently each time", "Nobody owns documentation or lifecycle planning", "Recurring work has no agreed priority"],
    problems: [
      { title: "Support starts only after something fails", description: "Urgent fixes crowd out maintenance, documentation and planned improvement." },
      { title: "User changes depend on memory", description: "Inconsistent onboarding and offboarding can leave people waiting or access in place too long." },
      { title: "Devices and licences are difficult to track", description: "Without a useful inventory, replacement and ownership decisions take longer." },
      { title: "Priorities compete without a plan", description: "Security, reliability and workflow work need an agreed order and responsible owner." },
    ],
    inclusions: ["Support-needs and responsibility review", "Useful device, software and service inventory design", "Joiner, mover and leaver routines", "Maintenance and lifecycle priorities", "Documentation, review and escalation responsibilities"],
    separateAgreement: ["Ongoing support hours, channels and response expectations", "Active monitoring, third-party platforms or subscriptions", "Included devices, locations, projects and out-of-scope work"],
    delivery: "A managed arrangement is not assumed. BoomoTech first reviews the environment and responsibilities, then documents what one-off support, planned maintenance and any ongoing agreement would cover. Inclusions, exclusions and costs must be agreed in writing.",
    outcomes: ["Clearer ownership of routine IT work", "Repeatable user and device processes", "A prioritised maintenance and improvement plan", "Better documentation for support and escalation"],
    diagram: { kind: "comparison", title: "Match responsibility to the support model", caption: "One-off help, planned maintenance and an ongoing arrangement solve different needs. Recurring responsibilities are included only when agreed in scope.", columns: [
      { title: "One-off support", items: ["A defined problem", "Agreed troubleshooting", "Handover notes"] }, { title: "Planned maintenance", items: ["Scheduled review", "Priority actions", "Lifecycle planning"] }, { title: "Ongoing arrangement", items: ["Named responsibilities", "Agreed channels", "Scope and expectations"] },
    ] },
    example: { situation: "A growing office has recurring device issues, inconsistent employee setup and no current list of systems or responsible vendors.", assessment: "Map the environment, recurring requests, user-change routines and ownership gaps before proposing any ongoing arrangement.", deliverables: ["A practical technology inventory", "Joiner and leaver checklists", "A prioritised maintenance plan and responsibility matrix"] },
    process: [
      { number: "01", title: "Map the environment", description: "Identify people, devices, services, vendors and recurring support needs." }, { number: "02", title: "Assign responsibilities", description: "Separate internal, BoomoTech and third-party responsibilities and identify gaps." }, { number: "03", title: "Agree routines and scope", description: "Document maintenance, user changes, escalation and recurring boundaries." }, { number: "04", title: "Review and prioritise", description: "Update documentation and choose the next useful improvement." },
    ],
    processTitle: "Turn recurring IT work into owned routines", ctaLabel: "Discuss ongoing IT support", ctaTitle: "Clarify what your team needs someone to own.",
    preparation: "Share your team size, locations, main systems, common requests, existing providers and the technology work that currently has no clear owner.",
    faqs: [
      { question: "Is managed IT the same as unlimited support?", answer: "No. Included work, limits, channels and response expectations must be defined in an agreement." }, { question: "Can we begin with a one-off review?", answer: "Yes. A current-state and responsibility review can stand alone and help determine whether ongoing support is useful." }, { question: "Does managed IT include monitoring?", answer: "Active monitoring is not implied. Any tools, coverage, alert handling and responsibilities need separate confirmation." }, { question: "What should an ongoing agreement define?", answer: "It should identify covered people, devices and locations; channels; responsibilities; exclusions; reviews; pricing; and approved response commitments." },
    ],
  },
  "/services/microsoft-365": {
    title: "Make Microsoft 365 easier to use and manage",
    description: "Get a clearer setup for business email, accounts, shared files and collaboration.",
    metaDescription: "Microsoft 365 help for business email, accounts, shared files, permissions, MFA, onboarding and offboarding.",
    audience: "For businesses using Microsoft 365 that need clearer account ownership, collaboration, access and administration.",
    signals: ["Business email or sign-in is unreliable", "Shared files are difficult to find or control", "Teams and OneDrive roles are unclear", "User onboarding and offboarding is inconsistent"],
    problems: [
      { title: "Account ownership is unclear", description: "Administrative access, recovery and billing may sit with the wrong person or be poorly documented." }, { title: "Email and calendar issues interrupt work", description: "Outlook profiles, authentication or mailbox configuration can stop routine communication." }, { title: "Shared files have confusing permissions", description: "OneDrive and SharePoint serve different purposes, and ad hoc sharing is difficult to manage." }, { title: "Joiners and leavers create access risk", description: "Accounts, licences, files and team membership need a repeatable process." },
    ],
    inclusions: ["Account, administrative ownership and recovery review", "Supported Outlook and business email troubleshooting", "Teams, OneDrive and SharePoint usage guidance", "Shared-file and permission review", "MFA, onboarding and offboarding recommendations"],
    separateAgreement: ["Microsoft licences and third-party charges", "Mailbox or file migrations after discovery", "Large information architecture, compliance or records projects"],
    delivery: "Safe administrative access, tenant ownership and licensing responsibilities must be confirmed before changes. Migration timing, data volume, dependencies and rollback requirements are assessed separately.",
    outcomes: ["Clearer administrative ownership", "More understandable file and collaboration patterns", "Safer user-change routines", "Documented day-to-day administration decisions"],
    diagram: { kind: "layers", title: "A connected Microsoft 365 workday", caption: "One account connects email, calendar, communication and shared files. Access controls and multi-factor authentication support every part of the workday.", layers: [
      { label: "Account sign-in", detail: "Identity, MFA and recovery" }, { label: "Email and calendar", detail: "Outlook and business communication" }, { label: "Team communication", detail: "Teams meetings and conversations" }, { label: "Shared files", detail: "OneDrive and SharePoint access" },
    ] },
    example: { situation: "A new employee can use email but cannot find shared project files, while a former employee remains in team access lists.", assessment: "Review account state, licences, group membership, file location and the intended user-change process.", deliverables: ["Corrected access within agreed scope", "A shared-file recommendation", "An onboarding and offboarding checklist"] },
    process: [
      { number: "01", title: "Confirm ownership and access", description: "Identify the tenant owner, approved administrator and safe access method." }, { number: "02", title: "Map how the team works", description: "Understand email, meetings, shared files and the people who need access." }, { number: "03", title: "Implement agreed changes", description: "Apply reviewed account, permission or collaboration changes with rollback where needed." }, { number: "04", title: "Document administration", description: "Record ownership, routine user changes and licensing responsibilities." },
    ],
    processTitle: "Connect accounts, collaboration and administration", ctaLabel: "Discuss your Microsoft 365 setup", ctaTitle: "Explain where Microsoft 365 is creating friction.",
    preparation: "Share the affected accounts, whether you control the tenant, the relevant Microsoft 365 area, the number of people affected and any planned staff or data change.",
    faqs: [
      { question: "Can you help with Microsoft 365 login problems?", answer: "BoomoTech can assess supported account, MFA and sign-in issues when ownership and authority are confirmed. Microsoft recovery or another administrator may be required." }, { question: "What is the difference between OneDrive and SharePoint?", answer: "OneDrive generally centres on an individual's working files; SharePoint supports team or organisational content. The structure depends on ownership and collaboration needs." }, { question: "Does this include Microsoft licensing?", answer: "No licensing resale or Microsoft partnership is claimed. Requirements, billing and purchases remain subject to separate confirmation." }, { question: "Can you plan a migration?", answer: "A migration can be assessed where supported, but data volume, sources, permissions, downtime, validation and rollback must be reviewed first." },
    ],
  },
  "/services/cybersecurity": {
    title: "Strengthen the security basics your business relies on",
    description: "Identify practical improvements across accounts, devices, backups and everyday working habits.",
    metaDescription: "Practical cybersecurity foundations across MFA, administrators, devices, backups, access routines and incident preparation.",
    audience: "For small organisations that want a practical security baseline and prioritised improvements without unsupported guarantees.",
    signals: ["MFA and administrator access are inconsistent", "Device updates have unclear ownership", "Access removal depends on memory", "Incident and recovery responsibilities are undocumented"],
    problems: [
      { title: "Important accounts rely on weak controls", description: "Shared administrators, missing MFA or unclear recovery increase the impact of a compromised account." }, { title: "Devices are updated inconsistently", description: "Unclear patching and protection responsibilities leave avoidable gaps." }, { title: "People do not know how to report suspicious activity", description: "Phishing and unusual sign-ins need a simple reporting and escalation routine." }, { title: "Recovery exists only as an assumption", description: "Backups and incident notes need understood responsibilities and restore steps." },
    ],
    inclusions: ["Account, multi-factor authentication (MFA) and administrator-access baseline", "Device update and protection review", "Joiner and leaver access routines", "Phishing-awareness and safer working guidance", "Backup readiness and incident priorities"],
    separateAgreement: ["Penetration testing or vulnerability certification", "Managed detection or emergency incident response", "Regulated compliance assessment, legal advice or certification"],
    delivery: "This service focuses on foundational improvement. Specialist testing, managed monitoring, formal compliance and incident response require separately validated capability and terms.",
    outcomes: ["A prioritised security improvement list", "Clearer ownership of accounts and devices", "Usable reporting and incident preparation", "Better understanding of residual risk"],
    diagram: { kind: "layers", title: "Security works in layers", caption: "People, accounts, devices, networks and recovery support one another. These layers reduce risk; they do not eliminate it.", layers: [
      { label: "People", detail: "Awareness and reporting" }, { label: "Accounts", detail: "MFA, administrators and access removal" }, { label: "Devices", detail: "Updates and endpoint protection" }, { label: "Network", detail: "Appropriate separation and configuration" }, { label: "Recovery", detail: "Backups, restore checks and incident roles" },
    ] },
    example: { situation: "A small business uses shared administrator accounts, has uneven MFA and no written process for suspicious email or departing staff.", assessment: "Review high-impact accounts, device ownership, access changes, reporting and recovery readiness.", deliverables: ["A prioritised action register", "Administrative-access and user-change recommendations", "A simple incident checklist"] },
    process: [
      { number: "01", title: "Identify important assets and access", description: "Understand the accounts, devices, data and responsibilities that matter most." }, { number: "02", title: "Review the baseline", description: "Check controls across identity, devices, people, network and recovery." }, { number: "03", title: "Prioritise improvements", description: "Separate urgent, near-term and planned actions by impact and effort." }, { number: "04", title: "Document ownership", description: "Record who maintains controls, handles access changes and coordinates an incident." },
    ],
    processTitle: "Build a security baseline people can follow", ctaLabel: "Discuss your security priorities", ctaTitle: "Start with the accounts, devices and data that matter most.",
    preparation: "Share your team size, main platforms, device ownership, MFA and backup practices, and what prompted the review. Do not send credentials or confidential incident evidence.",
    faqs: [
      { question: "Can cybersecurity risk be eliminated?", answer: "No. Controls can reduce likelihood and impact, but every organisation retains risk and needs recovery preparation." }, { question: "Is this a penetration test?", answer: "No. Foundational review differs from specialist penetration testing or formal vulnerability assessment." }, { question: "Does this prove regulatory compliance?", answer: "No. This service does not provide legal advice, certification or a compliance guarantee." }, { question: "Can you help after a suspected compromise?", answer: "BoomoTech can review the request and advise on a safe next step, but emergency incident response is not promised. Specialist responders may be required." },
    ],
  },
  "/services/backup-recovery": {
    title: "Know what is backed up—and how you would recover it",
    description: "Review important data, backup coverage and restore steps before an interruption puts them to the test.",
    metaDescription: "Backup and recovery planning covering important data, backup copies, retention, restore testing and responsibilities.",
    audience: "For businesses and professionals who depend on files, cloud services or devices but cannot yet explain how recovery would work.",
    signals: ["Important data exists in one place", "Sync is treated as the only backup", "Restore tests have not been performed", "Recovery order and acceptable data loss are unclear"],
    problems: [
      { title: "Nobody can describe the coverage", description: "Important files, application data or configuration may sit outside expected protection." }, { title: "Sync is mistaken for independent backup", description: "Deletion or corruption may synchronise when another recovery copy is needed." }, { title: "Retention does not match the risk", description: "Version history must reflect how far back the business may need to recover." }, { title: "A restore has never been tested", description: "A successful backup job does not prove the right data can be restored usefully." },
    ],
    inclusions: ["Important data and system inventory", "Backup, sync, version-history and retention review", "Separate or offsite copy considerations", "Access, encryption and ownership considerations", "Restore-test plan and recovery checklist"],
    separateAgreement: ["Backup products, capacity and subscriptions", "Large-scale or damaged-media recovery", "Approved recovery-time and data-loss commitments"],
    delivery: "Recommendations depend on data volume, access, privacy, retention and priorities. Recovery time describes how long restoration may take; acceptable data loss describes how much recent work could be lost. Neither is promised until a design is agreed.",
    outcomes: ["A view of protected and unprotected data", "A practical restore-testing routine", "Clear recovery order and responsibilities", "Known gaps requiring a decision"],
    diagram: { kind: "flow", title: "Backups are useful when restoration is tested", caption: "This is an example architecture. Copies are not assumed to be independent or immutable until the actual systems are verified.", stages: [
      { label: "Important data", detail: "Files, systems and configuration" }, { label: "Backup copies", detail: "Coverage, frequency and retention" }, { label: "Protected separate copy", detail: "Offsite or separated where suitable" }, { label: "Restore test", detail: "Confirm access and usable data" }, { label: "Recovery checklist", detail: "Order, owners and communication" },
    ] },
    example: { situation: "A team stores current files in a synchronised folder but has never checked retention or restored a complete working folder.", assessment: "Identify important data, sync and backup behaviour, retention, access and recovery order.", deliverables: ["A coverage and gap summary", "A proposed copy and retention approach", "A sample restore test and recovery checklist"] },
    process: [
      { number: "01", title: "Identify what matters", description: "List important data, systems, owners and supported business tasks." }, { number: "02", title: "Map copies and retention", description: "Distinguish live data, sync, version history and backup." }, { number: "03", title: "Define recovery priorities", description: "Agree order, responsible people and realistic planning objectives." }, { number: "04", title: "Test and record restoration", description: "Restore an agreed sample safely and update the recovery checklist." },
    ],
    processTitle: "Move from assumed backup to tested recovery", ctaLabel: "Review your backup and recovery plan", ctaTitle: "Explain what data you cannot afford to lose.",
    preparation: "List important files and systems, where they are stored, existing backup or sync products, retention if known and any previous restore attempt.",
    faqs: [
      { question: "Is cloud storage the same as backup?", answer: "Not necessarily. Synchronisation, version history, retention and a separate backup solve different problems." }, { question: "What is a restore test?", answer: "It is a controlled attempt to recover an agreed sample and confirm that access, content and instructions work without overwriting live data." }, { question: "What do recovery time and acceptable data loss mean?", answer: "They describe the planned restoration period and tolerable loss of recent work. They guide design but are not guarantees without an agreed solution." }, { question: "Can every file be guaranteed?", answer: "No. Recovery depends on verified coverage, retention, access, data condition and architecture." },
    ],
  },
  "/services/network-wifi": {
    title: "Find the cause of unreliable Wi-Fi and network problems",
    description: "Understand dropouts, weak coverage and slow connections before spending money on more equipment.",
    metaDescription: "Network and Wi-Fi assessment covering internet service, routers, access points, cabling, coverage and guest access.",
    audience: "For small workplaces and home offices experiencing dropouts, weak coverage, inconsistent performance or confusing equipment.",
    signals: ["Calls or cloud tools drop out", "Some rooms have weak coverage", "Wired and wireless performance differ", "More equipment has not fixed the cause"],
    problems: [
      { title: "Internet and local Wi-Fi are confused", description: "A slow provider connection and weak wireless coverage require different investigation." }, { title: "Placement limits coverage", description: "Walls, distance, layout and interference can matter more than new equipment speed." }, { title: "The network grew without a design", description: "Extra switches, extenders and cables may add bottlenecks or obscure faults." }, { title: "Guest and business access share one path", description: "Appropriate separation can simplify access and reduce unnecessary exposure." },
    ],
    inclusions: ["Internet-service and local-network symptom review", "Router, firewall, switch and access-point roles", "Coverage, placement and interference considerations", "Cabling and wired-connection checks", "Guest-access and equipment recommendations"],
    separateAgreement: ["New equipment, cabling and licensed electrical work", "Onsite assessment outside confirmed locations", "Provider faults, guaranteed speeds or coverage"],
    delivery: "Remote diagnosis can separate provider, device and configuration symptoms. Physical coverage, placement and cabling often need onsite assessment. Equipment is recommended only after the likely cause is understood.",
    outcomes: ["A clear distinction between internet and Wi-Fi issues", "An evidence-based improvement path", "Better equipment and placement decisions", "Understandable network and guest-access notes"],
    diagram: { kind: "flow", title: "Understand the path before replacing equipment", caption: "The router connects the internet to the local network. A switch connects wired devices; access points provide Wi-Fi. Guest access can use a separately controlled path.", stages: [
      { label: "Internet", detail: "Service from the provider" }, { label: "Router / firewall", detail: "Connects and controls the local network" }, { label: "Network switch", detail: "Connects wired devices and access points" }, { label: "Workplace connections", options: ["Wired devices", "Wi-Fi access points", "Optional guest access"] },
    ] },
    example: { situation: "Video calls drop out in two meeting rooms while cabled computers remain stable and the router sits in a closed cupboard.", assessment: "Compare internet and wired performance, map access-point placement, review interference and confirm equipment roles.", deliverables: ["A likely-cause summary", "A coverage and placement recommendation", "An equipment or cabling scope where justified"] },
    process: [
      { number: "01", title: "Separate the symptoms", description: "Compare internet, wired, wireless, device and location behaviour." }, { number: "02", title: "Map the environment", description: "Review layout, walls, placement, interference, cabling and equipment." }, { number: "03", title: "Test likely causes", description: "Narrow provider, configuration, coverage and equipment issues." }, { number: "04", title: "Plan the improvement", description: "Recommend configuration, placement, cabling or equipment changes with dependencies." },
    ],
    processTitle: "Diagnose the connection from provider to device", ctaLabel: "Request a network assessment", ctaTitle: "Describe where and when the connection fails.",
    preparation: "Share the layout, affected rooms and devices, provider and plan if known, router and access-point models, wired-versus-wireless behaviour and when the problem occurs.",
    faqs: [
      { question: "Is slow internet the same as slow Wi-Fi?", answer: "No. The provider connection can be slow while Wi-Fi is healthy, or coverage can be poor while the incoming service is normal." }, { question: "What is the difference between a router and an access point?", answer: "A router connects and controls networks. An access point provides wireless access to an existing network. Some devices combine both roles." }, { question: "Should I buy a mesh system first?", answer: "Not automatically. Layout, cabling, interference, placement and current equipment should be reviewed first." }, { question: "Can you guarantee speed or coverage?", answer: "No. Results depend on the provider, building, interference, devices, cabling and agreed design." },
    ],
  },
  "/services/cloud-infrastructure": {
    title: "Choose infrastructure that fits how your business works",
    description: "Review hosting, storage, access and system dependencies before planning a change.",
    metaDescription: "Cloud and infrastructure planning across cloud, onsite and hybrid options, dependencies, migration, validation and handover.",
    audience: "For teams reviewing hosting, storage, servers, remote access or a change to systems that support daily work.",
    signals: ["System ownership and dependencies are unclear", "A server or hosting change is approaching", "Remote access is difficult to manage", "Cloud and onsite costs are hard to compare"],
    problems: [
      { title: "A change has hidden dependencies", description: "Applications, identity, storage, integrations and network access may rely on one another." }, { title: "Cloud is treated as the automatic answer", description: "Connectivity, control, maintenance and workload should drive the choice." }, { title: "Operational ownership is unclear", description: "Hosting does not remove ownership of access, updates, backup and vendors." }, { title: "Migration planning stops at data transfer", description: "Validation, rollback, communication and handover are also required." },
    ],
    inclusions: ["Current systems and dependency review", "Cloud, onsite and hybrid option assessment", "Access, connectivity and operational ownership", "Cost-factor comparison without promised savings", "Migration, validation, rollback and handover planning"],
    separateAgreement: ["Provider subscriptions, licences and usage charges", "Migration implementation after approval", "Managed hosting, monitoring or availability commitments"],
    delivery: "Recommendations follow discovery rather than a predetermined platform. Provider choice, data handling, migration windows, testing, rollback, backup and ownership must be agreed before implementation.",
    outcomes: ["A clear system and dependency map", "Options compared against operating needs", "A staged and testable change path", "Defined ownership after handover"],
    diagram: { kind: "comparison", title: "Compare infrastructure by operating need", caption: "Cloud, onsite and hybrid approaches have different trade-offs. Suitability depends on connectivity, control, maintenance ownership and workload.", columns: [
      { title: "Cloud", items: ["Internet-dependent access", "Provider platform", "Shared responsibility"] }, { title: "Onsite", items: ["Local control", "Local equipment", "Internal maintenance"] }, { title: "Hybrid", items: ["Connected environments", "More dependencies", "Integration ownership"] },
    ] },
    example: { situation: "A business application runs on an ageing onsite server, remote access is inconsistent and integrations are undocumented.", assessment: "Map users, integrations, storage, access, backup, connectivity and vendor requirements before comparing options.", deliverables: ["A current-state dependency map", "An options and trade-off comparison", "A migration, validation and rollback outline"] },
    process: [
      { number: "01", title: "Map systems and dependencies", description: "Identify workloads, users, data, integrations, access and ownership." }, { number: "02", title: "Compare viable options", description: "Review cloud, onsite and hybrid choices against real requirements." }, { number: "03", title: "Plan a reversible change", description: "Define stages, backup, validation, communication and rollback." }, { number: "04", title: "Validate and hand over", description: "Confirm functions, document operations and assign responsibility." },
    ],
    processTitle: "Move infrastructure with dependencies understood", ctaLabel: "Discuss your infrastructure plans", ctaTitle: "Start with the system or change you are considering.",
    preparation: "Share the systems, users and locations, current hosting, integrations, data sensitivity, connectivity constraints, known costs and reason for change.",
    faqs: [
      { question: "Should everything move to the cloud?", answer: "No. The right option depends on workload, access, connectivity, control, maintenance and risk." }, { question: "Will cloud reduce costs?", answer: "It may change cost structure, but savings are not guaranteed. Usage, migration, support and operational costs need comparison." }, { question: "What is a rollback plan?", answer: "It defines how to return to an approved working state if validation fails. Feasibility depends on the system and migration stage." }, { question: "Does hosting include backup and management?", answer: "Not automatically. Backup, updates, monitoring, support and security responsibilities must be checked." },
    ],
  },
  "/services/ai-automation": {
    title: "Reduce repetitive work with practical automation",
    description: "Start with a real workflow, identify the repeated steps and decide where automation or AI can help.",
    metaDescription: "Workflow automation discovery covering repeated work, rules, AI, validation, exceptions, privacy and human review.",
    audience: "For teams that repeatedly move information, send reminders or coordinate routine work across disconnected tools.",
    signals: ["The same information is entered more than once", "Follow-up depends on memory", "Routine work has many hand-offs", "An AI idea has no review or privacy boundary"],
    problems: [
      { title: "Repeated data entry wastes attention", description: "Moving details between forms, email and systems increases effort and mistakes." }, { title: "Follow-up relies on memory", description: "Reminders and status updates are missed without consistent triggers." }, { title: "Exceptions are discovered too late", description: "Automation needs a safe path for missing or unusual information." }, { title: "AI is proposed before the workflow is understood", description: "Rules may be simpler, more predictable and easier to maintain." },
    ],
    inclusions: ["Workflow and repeated-step mapping", "Rules-based automation versus AI assessment", "Tool connection and data-permission review", "Exception, human-review and fallback design", "Pilot, validation and maintenance recommendations"],
    separateAgreement: ["Third-party automation or AI subscriptions", "Production integrations and credentials", "Sensitive data or high-impact autonomous decisions"],
    delivery: "The starting point is a real process and approved data. Deterministic rules are preferred where they solve the problem. AI remains optional and needs clear review, privacy, exception and maintenance controls.",
    outcomes: ["A well-defined workflow improvement", "Clear rules, exceptions and ownership", "A smaller testable pilot", "Known privacy and maintenance requirements"],
    diagram: { kind: "flow", title: "Automate the routine path and keep people in control", caption: "Information is validated before action. Predictable work can follow rules; uncertain or sensitive cases move to human review. AI is optional.", stages: [
      { label: "Request received", detail: "Capture approved information" }, { label: "Validate information", detail: "Check fields and permissions" }, { label: "Choose the path", options: ["Rules-based action", "Optional AI assistance", "Human review"] }, { label: "Update the system", detail: "Apply an approved action" }, { label: "Record the outcome", detail: "Keep status and exceptions" },
    ] },
    example: { situation: "A team copies enquiry details into a sheet, manually assigns work and sends the same reminders each week.", assessment: "Map inputs, checks, assignment rules, exceptions, approved systems and human decisions.", deliverables: ["A workflow map with exception paths", "A rules-first pilot recommendation", "Validation, privacy and maintenance criteria"] },
    process: [
      { number: "01", title: "Map the real workflow", description: "Observe inputs, decisions, repeated work, systems and exceptions." }, { number: "02", title: "Choose the simplest control", description: "Decide whether a rule, integration, reminder or optional AI step fits." }, { number: "03", title: "Pilot with safe data", description: "Test a bounded path with validation, permissions and fallback." }, { number: "04", title: "Measure and maintain", description: "Review accuracy, exceptions and ownership before expanding." },
    ],
    processTitle: "Improve one workflow before scaling automation", ctaLabel: "Discuss a workflow you want to improve", ctaTitle: "Describe the repeated work and where it breaks down.",
    preparation: "Share the trigger, steps, people, systems, repeated information, common exceptions and consequence of an incorrect action. Do not include sensitive records.",
    faqs: [
      { question: "Does every automation need AI?", answer: "No. Rules, integrations and reminders are often easier to validate and maintain." }, { question: "What happens with an exception?", answer: "The workflow should stop, request information or send the case to a person. Silent guessing is not a safe fallback." }, { question: "Can time savings or ROI be guaranteed?", answer: "No. A pilot can establish a baseline, but results depend on volume, exceptions, adoption and maintenance." }, { question: "How is privacy handled?", answer: "Data sources, permissions, provider handling, retention and access must be reviewed before implementation." },
    ],
  },
  "/services/web-software": {
    title: "Build a website or tool around what your users need to do",
    description: "Turn a business problem into a focused website, application or internal tool with a clear delivery scope.",
    metaDescription: "Website and software discovery, design and development covering user tasks, accessibility, integrations, testing and handover.",
    audience: "For organisations planning a business website, customer journey, internal tool or focused software application.",
    signals: ["The website no longer supports customer tasks", "A manual workflow has become fragile", "Users struggle with an important action", "An idea needs scope before development"],
    problems: [
      { title: "The website does not guide action", description: "Visitors need clear services, trust cues and an obvious enquiry path." }, { title: "A manual process has outgrown its role", description: "Repeated work, access conflicts and fragile hand-offs may justify a focused tool." }, { title: "Requirements are mixed with solution ideas", description: "User tasks, content, data and acceptance criteria need separation." }, { title: "Ownership after launch is unclear", description: "Hosting, domains, content, maintenance and support need explicit handover." },
    ],
    inclusions: ["Problem, audience and user-task discovery", "Information architecture, requirements and scope", "Responsive and accessible interface design", "Approved integrations and data handling", "Testing, launch planning and handover"],
    separateAgreement: ["Third-party platforms, licences, hosting and content", "Complex integrations or data migration", "Ongoing maintenance and support"],
    delivery: "Projects are divided into reviewable stages. Scope, content ownership, data handling, integrations, hosting, acceptance criteria and post-launch responsibilities are agreed before implementation.",
    outcomes: ["A clearer product and delivery brief", "An interface centred on user tasks", "A tested implementation", "Documented ownership and handover"],
    diagram: { kind: "flow", title: "Move from a user task to a tested release", caption: "Each stage produces something reviewable before the next commitment, reducing the risk of building the wrong experience.", stages: [
      { label: "Discover", detail: "Problem, users and constraints" }, { label: "Map user tasks", detail: "Content, journeys and requirements" }, { label: "Prototype", detail: "Review structure and interaction" }, { label: "Build and test", detail: "Accessible implementation and validation" }, { label: "Handover", detail: "Launch, ownership and maintenance" },
    ] },
    example: { situation: "A service business has a dated website and manages enquiries in a shared spreadsheet that is easy to overwrite.", assessment: "Separate the public journey from the internal workflow and identify the minimum data and systems required.", deliverables: ["A requirements and content map", "A responsive prototype", "A staged build and handover scope"] },
    process: [
      { number: "01", title: "Define the user and task", description: "Agree who needs to do what, why it matters and how success is reviewed." }, { number: "02", title: "Shape content and interaction", description: "Map information, screens, data, accessibility and integrations." }, { number: "03", title: "Build in reviewable stages", description: "Implement agreed features with testing and controlled change." }, { number: "04", title: "Launch and hand over", description: "Validate the release, document ownership and agree maintenance separately." },
    ],
    processTitle: "Turn a business problem into a reviewable product", ctaLabel: "Discuss your website or software project", ctaTitle: "Start with the user task and business problem.",
    preparation: "Share the audience, key tasks, current process, content, connected systems, data sensitivity, constraints and who will own the result.",
    faqs: [
      { question: "Can you estimate before discovery?", answer: "A useful estimate needs enough detail about content, screens, data, integrations, acceptance criteria and ownership." }, { question: "Who owns the content and accounts?", answer: "Ownership must be agreed. Business accounts, domains and approved content should remain accessible to the owner." }, { question: "Is accessibility included?", answer: "Responsive and accessible design is part of the approach. Any specialist audit or formal claim must be agreed separately." }, { question: "What happens after launch?", answer: "Handover covers agreed documentation and ownership. Hosting, monitoring, maintenance and support require a separate arrangement." },
    ],
  },
  "/services/digital-presence": {
    title: "Help customers find your business and know what to do next",
    description: "Make your website, business information and customer contact paths clearer and more consistent.",
    metaDescription: "Digital presence review covering business information, service messaging, profiles, content, enquiry paths and ownership.",
    audience: "For small businesses whose website, listings or social touchpoints give customers inconsistent information or an unclear next step.",
    signals: ["Business details differ between channels", "Service messaging is difficult to understand", "Visitors cannot find the right enquiry action", "Content and account ownership are unclear"],
    problems: [
      { title: "Business information is inconsistent", description: "Different names, descriptions, hours or contact paths reduce confidence." }, { title: "Landing pages do not answer the need", description: "A service page should connect discovery context to a clear next action." }, { title: "Profiles are poorly owned", description: "Business accounts need clear ownership and recovery, not dependence on one person." }, { title: "Content has no maintenance plan", description: "Useful information needs an owner, review cycle and customer purpose." },
    ],
    inclusions: ["Customer touchpoint and business-information review", "Service-message and page-path recommendations", "Local business profile guidance where applicable", "Content and enquiry-path planning", "Measurement, account ownership and update responsibilities"],
    separateAgreement: ["Advertising management or media spend", "Ongoing social posting or content production", "Guaranteed rankings, leads or platform outcomes"],
    delivery: "Work uses verified business facts and approved accounts. Advertising, ongoing publishing and platform management are not implied and must be scoped separately.",
    outcomes: ["Consistent public business information", "Clear service messages and customer paths", "Defined account and content ownership", "A prioritised update plan"],
    diagram: { kind: "flow", title: "Connect each touchpoint to a useful next step", caption: "Search, listings and social touchpoints should lead to relevant information, a clear action and human follow-up. Rankings or enquiries cannot be guaranteed.", stages: [
      { label: "Customer touchpoint", options: ["Search", "Business listing", "Social profile"] }, { label: "Relevant service page", detail: "Consistent facts and useful explanation" }, { label: "Clear enquiry action", detail: "An appropriate request path" }, { label: "Human follow-up", detail: "Review and agree the next step" },
    ] },
    example: { situation: "A local business has different service wording across its website and profiles, and general enquiries arrive without useful context.", assessment: "Compare public details, service messages, account ownership and the path from discovery to enquiry.", deliverables: ["A consistency and ownership checklist", "Recommended page and enquiry paths", "A prioritised content update plan"] },
    process: [
      { number: "01", title: "Audit customer touchpoints", description: "Review public facts, messages, profiles, pages and actions." }, { number: "02", title: "Map customer intent", description: "Connect common questions to relevant information and a useful next step." }, { number: "03", title: "Prioritise corrections", description: "Fix important inconsistencies, ownership and confusing paths first." }, { number: "04", title: "Assign ongoing ownership", description: "Document who maintains accounts, content, responses and measurement." },
    ],
    processTitle: "Create a consistent path from discovery to enquiry", ctaLabel: "Review your digital presence", ctaTitle: "Show us where customers currently find you.",
    preparation: "Share the website and approved profile links, current service descriptions, account ownership, common questions and the action visitors should take.",
    faqs: [
      { question: "Does this guarantee search rankings?", answer: "No. Accurate information and useful pages improve customer experience, but rankings are controlled by external platforms." }, { question: "Is advertising management included?", answer: "No. Advertising strategy, creative work, account management and spend require separate confirmation." }, { question: "Do we need every social platform?", answer: "No. Choose touchpoints that suit the audience and can be maintained responsibly." }, { question: "Who should own business profiles?", answer: "The business should retain approved ownership and recovery access, then grant and remove individual access by role." },
    ],
  },
  "/services/ui-ux-branding": {
    title: "Design clearer experiences that help people take the next step",
    description: "Improve the way customers understand your service, navigate your interface and complete important tasks.",
    metaDescription: "UI, UX and branding support covering journeys, wireframes, responsive components, accessibility, prototypes and handover.",
    audience: "For teams improving an existing digital experience or defining a coherent interface and identity for a new one.",
    signals: ["Users get lost in an important journey", "Interfaces are inconsistent across screens", "The identity does not work well digitally", "A project needs review before implementation"],
    problems: [
      { title: "The user journey is difficult to follow", description: "People may understand the service but still struggle to complete the next task." }, { title: "Patterns change from screen to screen", description: "Inconsistent labels, controls and hierarchy increase effort." }, { title: "Brand assets do not form a digital system", description: "A logo alone does not define accessible colours, type, components and states." }, { title: "A rebrand is proposed too early", description: "The existing identity may need focused adaptation rather than replacement." },
    ],
    inclusions: ["User-task and journey review", "Information hierarchy and wireframes", "Responsive UI components and states", "Accessibility considerations and prototype review", "Digital identity refinement and handover"],
    separateAgreement: ["Research recruitment or formal usability studies", "Full naming, brand strategy or print program", "Implementation, content production or specialist certification"],
    delivery: "The scope distinguishes user experience, interface design and identity work. Existing assets and user needs are reviewed before deciding whether focused improvement or a broader redesign is justified.",
    outcomes: ["A clearer user path and hierarchy", "Consistent responsive interface patterns", "A practical digital identity system", "Reviewable prototypes and implementation guidance"],
    diagram: { kind: "before-after", title: "Reduce choices and make the next action clear", caption: "This fictional enquiry flow illustrates a design principle only. It is not a client result and makes no measured conversion claim.", before: ["Mixed navigation labels", "Scattered service information", "Several competing actions", "Unclear confirmation"], after: ["Task-based navigation", "Relevant service explanation", "One primary action", "Clear request status"] },
    example: { situation: "A service website has competing menus, different button labels and a long enquiry form with no clear confirmation.", assessment: "Map the customer task, review hierarchy and patterns, then test a simpler journey before implementation.", deliverables: ["A current and proposed journey map", "Responsive wireframes or prototype", "A component and interaction handover brief"] },
    process: [
      { number: "01", title: "Define the user task", description: "Identify audience, context, decision and action." }, { number: "02", title: "Simplify the journey", description: "Organise content, navigation and states around the user's decisions." }, { number: "03", title: "Prototype the interface", description: "Apply accessible components and brand rules in a responsive model." }, { number: "04", title: "Review and hand over", description: "Resolve feedback, document states and prepare implementation guidance." },
    ],
    processTitle: "Connect user needs, interface decisions and identity", ctaLabel: "Discuss your design project", ctaTitle: "Share the journey or interface that needs to become clearer.",
    preparation: "Share the current interface or brand assets, audience, important task, accessibility needs, project stage and whether implementation is required.",
    faqs: [
      { question: "What is the difference between UX and UI?", answer: "UX covers the task, journey and ease of use. UI covers the screens, controls, layout and interaction used to complete it." }, { question: "Does branding mean a full rebrand?", answer: "No. An identity may only need clearer digital rules, accessible colours, typography and component treatment." }, { question: "Will you provide a prototype?", answer: "A prototype can be included when it helps review structure and interaction. Its coverage is agreed in scope." }, { question: "Can accessibility be guaranteed by design alone?", answer: "No. Design, content, implementation, testing and ongoing updates all affect accessibility. Formal certification requires separate scope." },
    ],
  },
};
