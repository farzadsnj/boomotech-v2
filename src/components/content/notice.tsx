export function Notice({ tone, title, body }: { tone: "info" | "safety" | "draft"; title: string; body: string }) {
  return (
    <aside className={`notice notice--${tone}`}>
      <span aria-hidden="true" className="notice__icon">{tone === "safety" ? "!" : "i"}</span>
      <div><h2>{title}</h2><p>{body}</p></div>
    </aside>
  );
}
