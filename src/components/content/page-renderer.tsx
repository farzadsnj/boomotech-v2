import Link from "next/link";
import Image from "next/image";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/motion/reveal";
import { services } from "@/content/services";
import { solutions } from "@/content/solutions";
import { serviceGroupForPath, serviceGroups } from "@/content/service-groups";
import type { HubPage, InfoPage, PageRecord, ServiceRecord, SolutionRecord } from "@/content/types";
import { Breadcrumbs } from "./breadcrumbs";
import { FaqList } from "./faq-list";
import { Notice } from "./notice";
import { ProcessSteps } from "./process-steps";
import { RelatedLinks } from "./related-links";

function Hero({ page, detail }: { page: PageRecord; detail?: string }) {
  const visual = "visual" in page ? page.visual : null;
  return (
    <header className={`inner-hero inner-hero--${page.kind}`}>
      <div className="container">
        <Breadcrumbs path={page.path} title={page.title} />
        <div className={`inner-hero__grid${visual ? " inner-hero__grid--visual" : ""}`}>
          <div><p className="eyebrow"><span className="eyebrow-line" />{page.eyebrow}</p><h1>{page.title}</h1></div>
          <div className="inner-hero__summary"><p>{page.description}</p>{detail ? <p className="inner-hero__detail">{detail}</p> : null}</div>
          {visual ? <div className="inner-hero__visual"><Image alt={visual.alt} fill priority sizes="(max-width: 800px) 90vw, 36vw" src={visual.src} /></div> : null}
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

function CardGrid({ items }: { items: { title: string; description: string; href?: `/${string}`; action?: string }[] }) {
  return <div className="content-card-grid">{items.map((item, index) => item.href ? <Link className="content-card content-card--link" href={item.href} key={item.title}><span className="content-card__number">{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p><strong>{item.action ?? "Explore"} <ArrowIcon diagonal /></strong></Link> : <article className="content-card" key={item.title}><span className="content-card__number">{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>;
}

function Resources({ page }: { page: InfoPage }) {
  const resources = page.resources ?? [];
  const featured = resources.find((item) => item.featured);
  return <>{featured ? <Section eyebrow="FEATURED RESOURCE" title="A practical place to begin"><Link className="resource-feature" href={featured.href}><div><span>{featured.topic} · {featured.format}</span><h3>{featured.title}</h3><p>{featured.description}</p></div><div><small>{featured.readTime} · {featured.relatedService}</small><strong>{featured.action} <ArrowIcon diagonal /></strong></div></Link></Section> : null}<Section eyebrow="PRACTICAL LIBRARY" title="Guidance for the next step" muted><div className="resource-grid">{resources.filter((item) => !item.featured).map((item) => <Link className="resource-card" href={item.href} key={item.title}><span>{item.topic} · {item.format}</span><h3>{item.title}</h3><p>{item.description}</p><small>{item.readTime} · {item.relatedService}</small><strong>{item.action} <ArrowIcon diagonal /></strong></Link>)}</div></Section></>;
}

function ClosingCta({ label = "Request a Consultation", href = "/booking", description = "Bring the situation in your own words. A request starts a conversation and does not confirm an appointment.", servicePath }: { label?: string; href?: string; description?: string; servicePath?: string }) {
  return <section className="inner-cta"><div className="container inner-cta__grid"><div><p className="eyebrow"><span className="eyebrow-line" />NEXT STEP</p><h2>Start with a clear conversation.</h2><p>{description}</p></div><ButtonLink bookingService={servicePath} href={href} variant="light">{label}</ButtonLink></div></section>;
}

function ServicePage({ page }: { page: ServiceRecord }) {
  const group = serviceGroupForPath(page.path);
  return <div className={`service-detail service-detail--${group?.accent ?? "sky"}`}><Hero detail={page.audience} page={page} />
    <section className="service-context"><div className="container"><span>{group?.label ?? "Service"}</span><p>{group?.heading}</p><Link href="/services">Compare all services <ArrowIcon diagonal /></Link></div></section>
    <Section eyebrow="WHEN THIS MAY HELP" title="Recognise the friction"><BulletGrid items={page.signals} /></Section>
    <Section eyebrow="POSSIBLE INCLUSIONS" title="A scope shaped around the need" muted><BulletGrid items={page.inclusions} /><div className="delivery-note"><h3>Delivery approach</h3><p>{page.delivery}</p></div></Section>
    <Section eyebrow="PRACTICAL OUTCOMES" title="What the work may improve"><BulletGrid items={page.outcomes} /></Section>
    <Section eyebrow="A SIMPLE PROCESS" title="Clear stages, visible decisions" muted><ProcessSteps steps={page.process} /></Section>
    {page.faqs.length ? <Section eyebrow="HELPFUL NOTES" title="Questions to consider"><FaqList items={page.faqs} /></Section> : null}
    <Section eyebrow="RELATED SERVICES" title="Continue exploring" muted><RelatedLinks links={page.related} /></Section>
    <ClosingCta servicePath={page.path} /></div>;
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
  if (page.kind === "services-hub") return <><Hero page={page} /><section className="service-directory section-space"><div className="container"><nav aria-label="Service goals" className="service-directory__jump">{serviceGroups.map((group) => <a href={`#${group.id}`} key={group.id}>{group.label}</a>)}</nav>{serviceGroups.map((group) => <section className={`service-directory__group service-directory__group--${group.accent}`} id={group.id} key={group.id}><div className="service-directory__intro"><p className="eyebrow">{group.label}</p><h2>{group.heading}</h2><p>{group.description}</p></div><div className="service-directory__cards">{group.services.map((record) => <Link className="service-directory__card" href={record.path} key={record.path}><div className="service-directory__icon"><Image alt="" fill sizes="120px" src={record.visual.src} /></div><div><h3>{record.name}</h3><p>{record.description}</p><span>Explore service <ArrowIcon diagonal /></span></div></Link>)}</div></section>)}</div></section><ClosingCta /></>;
  return <><Hero page={page} /><Section eyebrow="SITUATIONS" title="Find the path closest to your work">
    <div className="catalogue-grid">{records.map((record, index) => <Link aria-label={`Explore ${record.title}`} className="catalogue-card" href={record.path} key={record.path}><div className="catalogue-card__visual"><Image alt={record.visual.alt} fill sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, 390px" src={record.visual.src} /><span>{String(index + 1).padStart(2, "0")}</span></div><div className="catalogue-card__body"><h2>{record.title}</h2><p>{record.description}</p><strong>Explore {page.kind === "services-hub" ? "service" : "solution"} <ArrowIcon diagonal /></strong></div></Link>)}</div>
  </Section><ClosingCta /></>;
}

function InfoPageView({ page }: { page: InfoPage }) {
  return <><Hero page={page} />
    {page.path === "/about" ? <section className="about-story"><div className="container about-story__grid"><div><p className="eyebrow"><span className="eyebrow-line" />WHY BOOMOTECH</p><h2>Technical capability should make the next decision clearer.</h2><p>BoomoTech connects hands-on problem solving with thoughtful systems work. The goal is to understand what matters, explain the trade-offs and build a practical path forward.</p></div><div className="about-story__visual" aria-hidden="true"><span>Listen</span><span>Clarify</span><span>Build</span><i>BT</i></div></div></section> : null}
    {page.notice ? <div className="container notice-wrap"><Notice {...page.notice} /></div> : null}
    {page.resources?.length ? <Resources page={page} /> : null}
    {page.cards?.length ? <Section eyebrow="AT A GLANCE" title="Choose a useful starting point"><CardGrid items={page.cards} /></Section> : null}
    {page.sections?.map((section, index) => <Section eyebrow={`${String(index + 1).padStart(2, "0")} / GUIDANCE`} key={section.title} muted={index % 2 === 0} title={section.title}>
      {section.description ? <p className="prose-lead">{section.description}</p> : null}{section.items ? <BulletGrid items={section.items} /> : null}
    </Section>)}
    {page.process?.length ? <Section eyebrow="HOW TO PREPARE" title="Build a useful brief" muted><ProcessSteps steps={page.process} /></Section> : null}
    {page.faqs?.length ? <Section eyebrow="QUESTIONS" title="Useful answers"><FaqList items={page.faqs} /></Section> : null}
    {page.related?.length ? <Section eyebrow="CONTINUE EXPLORING" title="Related information" muted><RelatedLinks links={page.related} /></Section> : null}
    {page.cta ? <ClosingCta description={page.cta.description} href={page.cta.href} label={page.cta.label} /> : page.kind !== "legal" ? <ClosingCta /> : null}
  </>;
}

export function PageRenderer({ page }: { page: PageRecord }) {
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "/" }, ...page.path.split("/").filter(Boolean).map((part, index, parts) => ({ "@type": "ListItem", position: index + 2, name: index === parts.length - 1 ? page.title : part.replaceAll("-", " "), item: `/${parts.slice(0, index + 1).join("/")}` }))] };
  let content: React.ReactNode;
  switch (page.kind) {
    case "service": content = <ServicePage page={page} />; break;
    case "solution": content = <SolutionPage page={page} />; break;
    case "services-hub":
    case "solutions-hub": content = <HubPageView page={page} />; break;
    default: content = <InfoPageView page={page} />;
  }
  return <><script dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replaceAll("<", "\\u003c") }} type="application/ld+json" />{content}</>;
}
