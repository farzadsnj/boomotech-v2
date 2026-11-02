"use client";

import { useId, useRef, useState, type CSSProperties } from "react";

export type OrbitStage = { label: string; description: string };

export function OrbitDiagram({ centre, stages, variant = "process", label }: { centre: string; stages: readonly OrbitStage[]; variant?: "process" | "about"; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const pointerActivation = useRef(false);
  const popupId = useId();
  const selected = active === null ? null : stages[active];

  return (
    <div
      aria-label={label}
      className={`orbit-diagram orbit-diagram--${variant}${active !== null ? " is-paused" : ""}`}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(null); }}
      onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setActive(null); } }}
      onMouseLeave={() => { if (!root.current?.contains(document.activeElement)) setActive(null); }}
      ref={root}
    >
      <div className="orbit-diagram__stage">
        <div className="orbit-diagram__rings" aria-hidden="true" />
        <div className="orbit-diagram__track">
          {stages.map((stage, index) => (
            <div className="orbit-diagram__position" key={stage.label} style={{ "--orbit-angle": `${index * (360 / stages.length)}deg` } as CSSProperties}>
              <button
                aria-controls={popupId}
                aria-expanded={active === index}
                className="orbit-diagram__node"
                onClick={() => { pointerActivation.current = false; setActive((value) => value === index ? null : index); }}
                onFocus={() => { if (!pointerActivation.current) setActive(index); }}
                onMouseEnter={variant === "about" ? undefined : () => setActive(index)}
                onPointerDown={() => { pointerActivation.current = true; }}
                type="button"
              >
                <span>{stage.label}</span>
              </button>
            </div>
          ))}
        </div>
        <div className="orbit-diagram__centre" aria-hidden="true">{centre}</div>
      </div>
      <div className={`orbit-diagram__popover${selected ? " is-visible" : ""}`} id={popupId} role="region" aria-label="Stage details">
        {selected ? <><strong>{selected.label}</strong><p>{selected.description}</p><button aria-label="Close stage details" onClick={() => setActive(null)} type="button">×</button></> : <p>Hover, focus or tap a stage to learn more.</p>}
      </div>
    </div>
  );
}
