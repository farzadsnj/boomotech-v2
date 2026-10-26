"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { useEnquiryContext } from "@/features/enquiry/context";
import { problemOptions, recommendationFor } from "@/features/enquiry/recommendation";
import type { EnquiryAudience, EnquiryCategory } from "@/features/enquiry/types";

const audiences: Array<{ id: EnquiryAudience; label: string; description: string }> = [
  { id: "personal", label: "For home & individuals", description: "Help with computers, Wi-Fi, printers, email, files or buying decisions." },
  { id: "business", label: "For businesses", description: "Support, systems, security, websites and practical improvements." },
  { id: "unsure", label: "Not sure? Describe your problem", description: "Start in everyday language and change the suggested service later." },
];

const stages = [
  { id: "broken", label: "Something is not working now" },
  { id: "planning", label: "I am planning an improvement" },
  { id: "unsure", label: "Not sure / skip this question" },
] as const;

export function ServicePathfinder() {
  const { updateContext } = useEnquiryContext();
  const [audience, setAudience] = useState<EnquiryAudience | null>(null);
  const [category, setCategory] = useState<EnquiryCategory | null>(null);
  const [stage, setStage] = useState<(typeof stages)[number]["id"] | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const recommendation = category && stage ? recommendationFor(category, stage) : null;

  function chooseAudience(value: EnquiryAudience) {
    setAudience(value); setCategory(null); setStage(null); updateContext({ audience: value });
  }
  function chooseCategory(value: EnquiryCategory) {
    setCategory(value); setStage("unsure");
    const option = problemOptions.find(({ id }) => id === value)!;
    updateContext({ category: value, servicePath: option.servicePath, serviceChoice: "suggested", intent: option.intent });
  }
  function chooseStage(value: (typeof stages)[number]["id"]) {
    setStage(value);
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  return <div className="pathfinder pathfinder--guided" data-testid="service-pathfinder">
    <div className="pathfinder__prompt">
      <p className="eyebrow"><span className="eyebrow-line" />FIND A STARTING POINT</p>
      <h2>Tell us who needs help, then choose the closest problem.</h2>
      <p>No technical name is required. This guidance stays in your browser and is not sent until you review and submit a request.</p>
    </div>

    <section className="pathfinder__step" aria-labelledby="pathfinder-audience-title">
      <div><span>01</span><h3 id="pathfinder-audience-title">Who is this for?</h3><p>Home-office users can choose either and change it later.</p></div>
      <div className="pathfinder__audiences">{audiences.map((option) => <button aria-pressed={audience === option.id} key={option.id} onClick={() => chooseAudience(option.id)} type="button"><strong>{option.label}</strong><span>{option.description}</span></button>)}</div>
    </section>

    {audience ? <section className="pathfinder__step" aria-labelledby="pathfinder-problem-title">
      <div><span>02</span><h3 id="pathfinder-problem-title">What is closest to the problem or goal?</h3><p>Choose “Not sure” if several options fit.</p></div>
      <div className="pathfinder__problems">{problemOptions.map((option) => <button aria-pressed={category === option.id} key={option.id} onClick={() => chooseCategory(option.id)} type="button"><strong>{option.label}</strong><span>{option.examples}</span></button>)}</div>
    </section> : null}

    {category ? <section className="pathfinder__step pathfinder__step--compact" aria-labelledby="pathfinder-stage-title">
      <div><span>03</span><h3 id="pathfinder-stage-title">Is something broken now, or are you planning?</h3><p>This helps choose the type of request. It does not set urgency or promise a response time.</p></div>
      <div className="pathfinder__stages">{stages.map((option) => <button aria-pressed={stage === option.id} key={option.id} onClick={() => chooseStage(option.id)} type="button">{option.label}</button>)}</div>
    </section> : null}

    {recommendation ? <div className="pathfinder__result pathfinder__result--sky" aria-live="polite" ref={resultRef} tabIndex={-1}>
      <div><span className="pathfinder__result-label">Suggested starting point</span><h3>{recommendation.primary?.name ?? "Send the problem without choosing a service"}</h3><p>{recommendation.why}</p><small>You can change this suggestion in the request form.</small></div>
      <div className="pathfinder__recommendation-actions">
        {recommendation.primary ? <Link className="text-link" href={recommendation.primary.path}>Understand this service <ArrowIcon diagonal /></Link> : null}
        <ButtonLink bookingIntent={recommendation.option.intent} bookingService={recommendation.option.servicePath} href="/booking" onClick={() => updateContext({ audience: audience ?? "unsure", category: category ?? "other", servicePath: recommendation.option.servicePath, serviceChoice: "suggested", intent: recommendation.option.intent })}>Send a request</ButtonLink>
        {recommendation.alternatives.length ? <div className="pathfinder__alternatives"><span>Other possible paths:</span>{recommendation.alternatives.map((service) => <Link href={service.path} key={service.path}>{service.name}</Link>)}</div> : null}
      </div>
    </div> : <p className="pathfinder__empty">{audience ? "Choose the closest problem or goal to continue." : "Choose a personal, business or unsure starting point. You can also browse all services."} <Link href="/services">Browse all services</Link></p>}
  </div>;
}
