"use client";

import Link from "next/link";
import { useState } from "react";
import { serviceGroups } from "@/content/service-groups";
import { ArrowIcon } from "@/components/ui/arrow-icon";

const goals = [
  { id: "support", label: "Fix an IT problem", hint: "Devices, accounts, email or everyday interruptions" },
  { id: "secure", label: "Reduce risk", hint: "Security, backups, access or recovery" },
  { id: "improve", label: "Improve our systems", hint: "Cloud, infrastructure or repetitive work" },
  { id: "build", label: "Build something useful", hint: "A website, software or digital experience" }
] as const;

export function ServicePathfinder() {
  const [selected, setSelected] = useState<(typeof goals)[number]["id"] | null>(null);
  const group = serviceGroups.find((item) => item.id === selected);
  return <div className="pathfinder" data-testid="service-pathfinder">
    <div className="pathfinder__prompt">
      <p className="eyebrow"><span className="eyebrow-line" />FIND A STARTING POINT</p>
      <h2>What would you like technology to do better?</h2>
      <p>Choose the closest goal. You can explore the options without sharing personal information.</p>
    </div>
    <div className="pathfinder__goals" role="group" aria-label="Choose your technology goal">
      {goals.map((goal) => <button aria-pressed={selected === goal.id} key={goal.id} onClick={() => setSelected(goal.id)} type="button"><strong>{goal.label}</strong><span>{goal.hint}</span><ArrowIcon diagonal /></button>)}
    </div>
    {group ? <div className={`pathfinder__result pathfinder__result--${group.accent}`} aria-live="polite">
      <div><span className="pathfinder__result-label">A useful place to start</span><h3>{group.heading}</h3><p>{group.description}</p></div>
      <ul>{group.services.slice(0, 3).map((service) => <li key={service.path}><Link href={service.path}><span><strong>{service.name}</strong><small>{service.description}</small></span><ArrowIcon diagonal /></Link></li>)}</ul>
      <Link className="text-link" href="/services">Compare all services <ArrowIcon diagonal /></Link>
    </div> : <p className="pathfinder__empty">Select a goal to see a focused set of services.</p>}
  </div>;
}
