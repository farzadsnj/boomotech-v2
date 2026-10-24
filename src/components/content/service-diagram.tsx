import type { ServiceDiagram as ServiceDiagramData } from "@/content/types";

export function ServiceDiagram({ diagram }: { diagram: ServiceDiagramData }) {
  let content: React.ReactNode;

  if (diagram.kind === "flow") {
    content = <ol className="service-diagram__flow">
      {diagram.stages.map((stage, index) => <li key={`${stage.label}-${index}`}>
        <span className="service-diagram__number">{String(index + 1).padStart(2, "0")}</span>
        <strong>{stage.label}</strong>
        {stage.detail ? <p>{stage.detail}</p> : null}
        {stage.options?.length ? <ul>{stage.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
      </li>)}
    </ol>;
  } else if (diagram.kind === "layers") {
    content = <ol className="service-diagram__layers">
      {diagram.layers.map((layer, index) => <li key={layer.label}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <div><strong>{layer.label}</strong>{layer.detail ? <p>{layer.detail}</p> : null}</div>
      </li>)}
    </ol>;
  } else if (diagram.kind === "comparison") {
    content = <div className="service-diagram__comparison">
      {diagram.columns.map((column) => <section key={column.title}>
        <h3>{column.title}</h3>
        <ul>{column.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>)}
    </div>;
  } else {
    content = <div className="service-diagram__before-after">
      <section><h3>Before</h3><ul>{diagram.before.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <span aria-hidden="true">→</span>
      <section><h3>Clearer path</h3><ul>{diagram.after.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>;
  }

  return <figure className={`service-diagram service-diagram--${diagram.kind}`} aria-labelledby="service-diagram-title">
    <h3 className="visually-hidden" id="service-diagram-title">{diagram.title}</h3>
    {content}
    <figcaption>{diagram.caption}</figcaption>
  </figure>;
}
