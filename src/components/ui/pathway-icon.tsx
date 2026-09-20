type Name = "support" | "systems" | "build" | "advice";

export function PathwayIcon({ name }: { name: Name }) {
  const shared = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" className="pathway-icon" viewBox="0 0 40 40" fill="none" focusable="false">
      {name === "support" && <><rect x="6" y="8" width="28" height="21" rx="3" {...shared} /><path d="M13 34h14M20 29v5M11 18h7l3-4 3 8 2-4h3" {...shared} /></>}
      {name === "systems" && <><rect x="6" y="7" width="12" height="12" rx="2" {...shared} /><rect x="22" y="21" width="12" height="12" rx="2" {...shared} /><path d="M18 13h6a5 5 0 0 1 5 5v3M22 27h-6a5 5 0 0 1-5-5v-3" {...shared} /></>}
      {name === "build" && <><rect x="5" y="7" width="30" height="26" rx="3" {...shared} /><path d="M5 14h30M12 10.5h.01M17 10.5h.01M13 23l4-4m-4 4 4 4m14-4-4-4m4 4-4 4" {...shared} /></>}
      {name === "advice" && <><path d="M20 5a11 11 0 0 0-7 19.5V28h14v-3.5A11 11 0 0 0 20 5ZM14 32h12M17 35h6" {...shared} /><path d="M16 20c1-2 2-3 4-3s3 1 4 3" {...shared} /></>}
    </svg>
  );
}
