import type { ProcessStep } from "@/content/types";

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="inner-process">
      {steps.map((step) => <li key={`${step.number}-${step.title}`}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}
    </ol>
  );
}
