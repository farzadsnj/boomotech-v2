"use client";

import Link from "next/link";
import { useState } from "react";
import { serviceQuestions } from "@/content/service-questions";
import { serviceByPath } from "@/content/services";

export function ServiceQuestions({ servicePath }: { servicePath: string }) {
  const questions = serviceQuestions[servicePath] ?? [];
  const service = serviceByPath.get(servicePath as `/${string}`);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const complete = questions.length > 0 && questions.every(({ id }) => answers[id]);
  return <section className="service-questions" aria-labelledby="service-questions-title">
    <div className="container service-questions__grid"><div className="service-questions__intro"><p className="eyebrow"><span className="eyebrow-line" />QUICK PREPARATION</p><h2 id="service-questions-title">Clarify what you need.</h2><p>These answers stay on this page. They provide a simple preparation summary and are not a diagnosis.</p></div>
      <div className="service-questions__form">{questions.map((question) => <fieldset key={question.id}><legend>{question.prompt}</legend><div>{question.options.map((option) => <label key={option}><input checked={answers[question.id] === option} name={`${servicePath}-${question.id}`} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} type="radio" /><span>{option}</span></label>)}</div></fieldset>)}
        {complete ? <div className="service-questions__result" aria-live="polite"><h3>Your preparation summary</h3><p>You are considering <strong>{service?.name ?? "this service"}</strong> for:</p><ul>{questions.map((question) => <li key={question.id}><span>{question.prompt}</span><strong>{answers[question.id]}</strong></li>)}</ul><Link className="button-link button-link--primary" href={`/support?service=${encodeURIComponent(servicePath)}#request-support`}>Request support</Link></div> : <p className="service-questions__hint">Choose one answer for each question to create a local summary.</p>}
      </div>
    </div>
  </section>;
}
