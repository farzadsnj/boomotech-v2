"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { healthQuestions, scoreHealthCheck, type HealthArea } from "@/content/health-check";

const areaLinks: Record<HealthArea, { label: string; href: string; description: string }> = {
  support: { label: "IT support", href: "/services/it-support", description: "Create a clearer path for day-to-day issues." },
  security: { label: "Cybersecurity", href: "/services/cybersecurity", description: "Review identity, device and account foundations." },
  systems: { label: "Cloud and infrastructure", href: "/services/cloud-infrastructure", description: "Understand and improve the systems behind work." },
  continuity: { label: "Backup and recovery", href: "/services/backup-recovery", description: "Plan how important information can be restored." }
};

export function HealthCheck() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const complete = step >= healthQuestions.length;
  const question = healthQuestions[step];
  const result = useMemo(() => scoreHealthCheck(answers), [answers]);
  function choose(score: number) { setAnswers((current) => ({ ...current, [question.id]: score })); setStep((current) => current + 1); }
  function reset() { setAnswers({}); setStep(0); }

  return <div className="health-tool">
    {!complete ? <>
      <div className="health-tool__progress"><span>Question {step + 1} of {healthQuestions.length}</span><progress max={healthQuestions.length} value={step} /></div>
      <fieldset><legend tabIndex={-1}>{question.prompt}</legend><p>{question.help}</p><div className="health-tool__answers">{question.answers.map((answer) => <button key={answer.label} onClick={() => choose(answer.score)} type="button">{answer.label}</button>)}</div></fieldset>
      {step > 0 ? <button className="text-button" onClick={() => setStep((current) => current - 1)} type="button">← Back to previous question</button> : null}
    </> : <div className={`health-result health-result--${result.level}`}>
      <p className="eyebrow">YOUR RESULT · {result.score}/20</p><h2>{result.title}</h2><p className="health-result__summary">{result.summary}</p>
      <div className="health-result__recommendations">{(result.areas.length ? result.areas : (["support"] satisfies HealthArea[])).map((area) => { const item = areaLinks[area]; return <article key={area}><h3>{item.label}</h3><p>{item.description}</p><Link href={item.href}>Explore this service →</Link></article>; })}</div>
      <div className="health-result__actions"><Link className="button-link" href="/booking">Discuss the result</Link><button onClick={() => window.print()} type="button">Print or save result</button><button onClick={reset} type="button">Start again</button></div>
      <p className="health-result__note">This self-check provides general guidance based only on your answers. It is not a security audit, technical diagnosis or guarantee.</p>
    </div>}
  </div>;
}
