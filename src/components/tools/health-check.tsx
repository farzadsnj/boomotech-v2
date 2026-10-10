"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const legendRef = useRef<HTMLLegendElement>(null);
  const focusNext = useRef(false);
  useEffect(() => { if (focusNext.current && !complete) { focusNext.current = false; requestAnimationFrame(() => legendRef.current?.focus()); } }, [step, complete]);
  function choose(score: number, keyboard: boolean) { setAnswers((current) => ({ ...current, [question.id]: score })); focusNext.current = keyboard; setStep((current) => current + 1); }
  function reset() { setAnswers({}); setStep(0); }

  return <div className="health-tool">
    {!complete ? <>
      <div className="health-tool__progress"><span>Question {step + 1} of {healthQuestions.length}</span><progress max={healthQuestions.length} value={step} /></div>
      <fieldset><legend ref={legendRef} tabIndex={-1}>{question.prompt}</legend><p>{question.help}</p><div className="health-tool__answers">{question.answers.map((answer) => <button aria-pressed={answers[question.id] === answer.score} key={answer.label} onClick={(event) => choose(answer.score, event.detail === 0)} type="button">{answer.label}</button>)}</div></fieldset>
      {step > 0 ? <button className="text-button" onClick={() => setStep((current) => current - 1)} type="button">← Back to previous question</button> : null}
    </> : <div className={`health-result health-result--${result.level}`}>
      <p className="eyebrow">YOUR RESULT · {result.score}/{healthQuestions.length * 2}</p><h2>{result.title}</h2><p className="health-result__summary">{result.summary}</p>
      <section className="health-result__priorities" aria-labelledby="health-priorities-title"><h3 id="health-priorities-title">Priority areas and services to explore</h3><div className="health-result__recommendations">{(result.areas.length ? result.areas : (["support"] satisfies HealthArea[])).map((area) => { const item = areaLinks[area]; return <article key={area}><h4>{item.label}</h4><p>{item.description}</p><Link href={item.href}>Explore this service →</Link></article>; })}</div></section>
      <section className="health-result__answers" aria-labelledby="health-answers-title"><h3 id="health-answers-title">Your answers</h3><dl>{healthQuestions.map((item) => <div key={item.id}><dt>{item.prompt}</dt><dd>{item.answers.find((answer) => answer.score === answers[item.id])?.label}</dd></div>)}</dl></section>
      <div className="health-result__actions"><Link className="button-link" href="/support#request-support">Get more assistance</Link><button onClick={() => window.print()} type="button">Print or save result</button><button onClick={reset} type="button">Start again</button></div>
      <p className="health-result__note">This self-check provides general guidance based only on your answers. It is not a security audit, technical diagnosis or guarantee.</p>
    </div>}
  </div>;
}
