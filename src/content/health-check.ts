export type HealthArea = "support" | "security" | "systems" | "continuity";
export type HealthAnswer = { label: string; score: number };
export type HealthQuestion = { id: string; area: HealthArea; prompt: string; help: string; answers: HealthAnswer[] };

const confidenceAnswers: HealthAnswer[] = [
  { label: "Yes, and it is reviewed", score: 0 },
  { label: "Partly or not consistently", score: 1 },
  { label: "No or I am not sure", score: 2 }
];

export const healthQuestions: HealthQuestion[] = [
  { id: "updates", area: "security", prompt: "Are operating systems and business applications updated consistently?", help: "Include laptops, desktops, phones, browsers and key business tools.", answers: confidenceAnswers },
  { id: "mfa", area: "security", prompt: "Is multi-factor authentication used for important accounts?", help: "Email, cloud storage and administrator accounts are useful places to check first.", answers: confidenceAnswers },
  { id: "backup", area: "continuity", prompt: "Are important files backed up and restore steps tested?", help: "A backup is most useful when recovery has been checked.", answers: confidenceAnswers },
  { id: "access", area: "security", prompt: "Are user accounts removed or updated when people change roles or leave?", help: "Clear account ownership reduces lingering access.", answers: confidenceAnswers },
  { id: "network", area: "systems", prompt: "Is your Wi-Fi and network reliable across the places people work?", help: "Think about dropouts, slow areas and shared passwords.", answers: confidenceAnswers },
  { id: "support", area: "support", prompt: "Does your team know where to go when a technology issue interrupts work?", help: "A clear support path can reduce delays and unsafe workarounds.", answers: confidenceAnswers },
  { id: "documentation", area: "systems", prompt: "Are key systems, suppliers and account owners documented?", help: "Useful documentation should be current and accessible to authorised people.", answers: confidenceAnswers },
  { id: "incident", area: "continuity", prompt: "Is there a simple plan for a lost device, hacked account or service outage?", help: "The first few actions and who to contact should be clear.", answers: confidenceAnswers },
  { id: "lifecycle", area: "systems", prompt: "Are ageing devices and software reviewed before they become urgent?", help: "Planned replacement is usually easier than emergency replacement.", answers: confidenceAnswers },
  { id: "phishing", area: "support", prompt: "Do people know how to identify and report suspicious messages?", help: "The goal is a safe, simple reporting habit rather than blame.", answers: confidenceAnswers }
];

export type HealthResult = { score: number; level: "steady" | "review" | "priority"; title: string; summary: string; areas: HealthArea[] };

export function scoreHealthCheck(answers: Record<string, number>): HealthResult {
  const score = healthQuestions.reduce((total, question) => total + (answers[question.id] ?? 0), 0);
  const areaScores = healthQuestions.reduce<Record<HealthArea, number>>((result, question) => {
    result[question.area] += answers[question.id] ?? 0;
    return result;
  }, { support: 0, security: 0, systems: 0, continuity: 0 });
  const areas = (Object.entries(areaScores) as [HealthArea, number][]).sort((a, b) => b[1] - a[1]).filter(([, value]) => value > 0).slice(0, 2).map(([area]) => area);
  if (score <= 5) return { score, level: "steady", title: "Your foundations look considered", summary: "Keep the basics reviewed and document changes as your needs evolve.", areas };
  if (score <= 12) return { score, level: "review", title: "A focused review could reduce friction", summary: "A few practical improvements may make everyday work more reliable and easier to support.", areas };
  return { score, level: "priority", title: "Several foundations deserve attention", summary: "Start with the areas that could most affect access, important data or day-to-day work.", areas };
}
