import Link from "next/link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/motion/reveal";
import { services } from "@/content/services";
import { solutions } from "@/content/solutions";
import type { HubPage, InfoPage, PageRecord, ServiceRecord, SolutionRecord } from "@/content/types";
import { Breadcrumbs } from "./breadcrumbs";
import { FaqList } from "./faq-list";
import { Notice } from "./notice";
import { ProcessSteps } from "./process-steps";
import { RelatedLinks } from "./related-links";

function Hero({ page, detail }: { page: PageRecord; detail?: string }) {
  return (
    <header className={`inner-hero inner-hero--${page.kind}`}>
      <div className="container">
        <Breadcrumbs path={page.path} title={page.title} />
        <div className="inner-hero__grid">
          <div><p className="eyebrow"><span className="eyebrow-line" />{page.eyebrow}</p><h1>{page.title}</h1></div>
          <div className="inner-hero__summary"><p>{page.description}</p>{detail ? <p className="inner-hero__detail">{detail}</p> : null}</div>
        </div>
      </div>
    </header>
  );
}

function Section({ eyebrow, title, children, muted = false }: { eyebrow: string; title: string; children: React.ReactNode; muted?: boolean }) {
  return <section className={`inner-section ${muted ? "inner-section--muted" : ""}`}><Reveal className="container"><div className="inner-section__heading"><p className="eyebrow"><span className="eyebrow-line" />{eyebrow}</p><h2>{title}</h2></div>{children}</Reveal></section>;
}

function BulletGrid({ items }: { items: string[] }) {
  return <ul className="bullet-grid">{items.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>;
}

function CardGrid({ items }: { items: { title: string; description: string }[] }) {
  return <div className="content-card-grid">{items.map((item, index) => <article className="content-card" key={item.title}><span className="content-card__number">{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>;
}

function ClosingCta({ label = "Explore consultation", href = "/book", description = "Bring the situation in your own words. The next step starts with understanding the need and confirming scope." }: { label?: string; href?: string; description?: string }) {
  return <section className="inner-cta"><div className="container inner-cta__grid"><div><p className="eyebrow"><span className="eyebrow-line" />NEXT STEP</p><h2>Start with a clear conversation.</h2><p>{description}</p></div><ButtonLink href={href} variant="light">{label}</ButtonLink></div></section>;
}

function ServicePage({ page }: { page: ServiceRecord }) {
  return <><Hero detail={page.audience} page={page} />
    <Section eyebrow="WHEN THIS MAY HELP" title="Recognise the friction"><BulletGrid items={page.signals} /></Section>
    <Section eyebrow="POSSIBLE INCLUSIONS" title="A scope shaped around the need" muted><BulletGrid items={page.inclusions} /><div className="delivery-note"><h3>Delivery approach</h3><p>{page.delivery}</p></div></Section>
    <Section eyebrow="PRACTICAL OUTCOMES" title="What the work may improve"><BulletGrid items={page.outcomes} /></Section>
    <Section eyebrow="A SIMPLE PROCESS" title="Clear stages, visible decisions" muted><ProcessSteps steps={page.process} /></Section>
    {page.faqs.length ? <Section eyebrow="HELPFUL NOTES" title="Questions to consider"><FaqList items={page.faqs} /></Section> : null}
    <Section eyebrow="RELATED SERVICES" title="Continue exploring" muted><RelatedLinks links={page.related} /></Section>
    <ClosingCta /></>;
}

function SolutionPage({ page }: { page: SolutionRecord }) {
  return <><Hero detail={page.audience} page={page} />
    <Section eyebrow="COMMON PRESSURES" title="Start with what gets in the way"><CardGrid items={page.challenges} /></Section>
    <Section eyebrow="USEFUL PRIORITIES" title="Build around the work" muted><BulletGrid items={page.priorities} /></Section>
    <Section eyebrow="APPROACH" title="Move from context to practical action"><ProcessSteps steps={page.approach} /></Section>
    <Section eyebrow="RELATED PATHS" title="Services that may contribute" muted><RelatedLinks links={page.related} /></Section>
    <ClosingCta /></>;
}

function HubPageView({ page }: { page: HubPage }) {
  const records = page.kind === "services-hub" ? services : solutions;
  return <><Hero page={page} /><Section eyebrow={page.kind === "services-hub" ? "SERVICE AREAS" : "SITUATIONS"} title={page.kind === "services-hub" ? "Choose a practical starting point" : "Find the path closest to your work"}>
    <div className="catalogue-grid">{records.map((record, index) => <Link className="catalogue-card" href={record.path} key={record.path}><span>{String(index + 1).padStart(2, "0")}</span><h3>{record.title}</h3><p>{record.description}</p><strong>Explore <ArrowIcon diagonal /></strong></Link>)}</div>
  </Section><ClosingCta /></>;
}

function InfoPageView({ page }: { page: InfoPage }) {
  return <><Hero page={page} />
    {page.notice ? <div className="container notice-wrap"><Notice {...page.notice} /></div> : null}
    {page.cards?.length ? <Section eyebrow="AT A GLANCE" title={page.kind === "shop" ? "Planned catalogue areas" : "Choose a useful starting point"}><CardGrid items={page.cards} /></Section> : null}
    {page.sections?.map((section, index) => <Section eyebrow={`${String(index + 1).padStart(2, "0")} / GUIDANCE`} key={section.title} muted={index % 2 === 0} title={section.title}>
      {section.description ? <p className="prose-lead">{section.description}</p> : null}{section.items ? <BulletGrid items={section.items} /> : null}
    </Section>)}
    {page.process?.length ? <Section eyebrow="HOW TO PREPARE" title="Build a useful brief" muted><ProcessSteps steps={page.process} /></Section> : null}
    {page.faqs?.length ? <Section eyebrow="QUESTIONS" title="Useful answers"><FaqList items={page.faqs} /></Section> : null}
    {page.related?.length ? <Section eyebrow="CONTINUE EXPLORING" title="Related information" muted><RelatedLinks links={page.related} /></Section> : null}
    {page.cta ? <ClosingCta description={page.cta.description} href={page.cta.href} label={page.cta.label} /> : page.kind !== "legal" && page.kind !== "shop" ? <ClosingCta /> : null}
  </>;
}

export function PageRenderer({ page }: { page: PageRecord }) {
  switch (page.kind) {
    case "service": return <ServicePage page={page} />;
    case "solution": return <SolutionPage page={page} />;
    case "services-hub":
    case "solutions-hub": return <HubPageView page={page} />;
    default: return <InfoPageView page={page} />;
  }
}
