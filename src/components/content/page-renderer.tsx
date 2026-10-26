import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
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
import { ServiceQuestions } from "./service-questions";
import { SupportRequestForm } from "@/features/booking/support-request-form";
import { FounderProfile } from "./founder-profile";
import { getSiteUrl } from "@/lib/site-url";
import { businessIdentity } from "@/content/business";
import { OrbitDiagram } from "@/components/ui/orbit-diagram";
import { PricingOverview } from "./pricing-overview";
import { LearningPortal } from "./learning-portal";
import { ServiceDiagram } from "./service-diagram";

function Hero({ page, detail, action }: { page: PageRecord; detail?: string; action?: { label: string; href?: string; servicePath?: string } }) {
  const visual = "visual" in page ? page.visual : null;
  const compact = ["/contact", "/support", "/pricing", "/get-a-quote"].includes(page.path);
  return (
    <header className={`inner-hero inner-hero--${page.kind}${compact ? " inner-hero--compact" : ""}`}>
      <div className="container">
        <Breadcrumbs path={page.path} title={page.title} />
        <div className={`inner-hero__grid${visual ? " inner-hero__grid--visual" : ""}`}>
          <div><p className="eyebrow"><span className="eyebrow-line" />{page.eyebrow}</p><h1>{page.title}</h1></div>
          <div className="inner-hero__summary"><p>{page.description}</p>{detail ? <p className="inner-hero__detail">{detail}</p> : null}{action ? <ButtonLink bookingService={action.servicePath} className="inner-hero__cta" href={action.href ?? "/booking"}>{action.label}</ButtonLink> : null}</div>
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

function ClosingCta({ label = "Request a consultation", title = "Start with a clear conversation.", href = "/booking", description = "Bring the situation in your own words. A request starts a conversation and does not confirm an appointment.", servicePath, intent = "consultation" }: { label?: string; title?: string; href?: string; description?: string; servicePath?: string; intent?: "consultation" | "quote" }) {
  return <section className="inner-cta"><div className="container inner-cta__grid"><div><p className="eyebrow"><span className="eyebrow-line" />NEXT STEP</p><h2>{title}</h2><p>{description}</p></div><ButtonLink bookingIntent={intent} bookingService={servicePath} href={href} variant="light">{label}</ButtonLink></div></section>;
}

function ServicePage({ page }: { page: ServiceRecord }) {
  const group = serviceGroupForPath(page.path);
  return <div className={`service-detail service-detail--${group?.accent ?? "sky"}`}><Hero action={{ label: page.ctaLabel, servicePath: page.path }} detail={page.audience} page={page} />
    <section className="service-context"><div className="container"><span>{group?.label ?? "Service"}</span><p>{group?.heading}</p><div className="service-context__actions"><Link href="/services">Compare services <ArrowIcon diagonal /></Link></div></div></section>
    <Section eyebrow="RECOGNISABLE PROBLEMS" title="When this service may help"><CardGrid items={page.problems} /></Section>
    <Section eyebrow="HOW IT FITS TOGETHER" title={page.diagram.title} muted><ServiceDiagram diagram={page.diagram} /></Section>
    <ServiceQuestions servicePath={page.path} />
    <Section eyebrow="SCOPE AND BOUNDARIES" title="What BoomoTech can help with"><div className="service-scope-grid"><article><h3>Possible inclusions</h3><BulletGrid items={page.inclusions} /></article><article><h3>Requires separate agreement</h3><BulletGrid items={page.separateAgreement} /></article></div><div className="delivery-note"><h3>Delivery approach</h3><p>{page.delivery}</p></div></Section>
    <Section eyebrow="ILLUSTRATIVE EXAMPLE" title="A practical way this could work" muted><article className="service-example"><div><h3>Situation</h3><p>{page.example.situation}</p></div><div><h3>Assessment and work</h3><p>{page.example.assessment}</p></div><div><h3>Possible deliverables</h3><ul>{page.example.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div><ButtonLink bookingService={page.path} href="/booking">{page.ctaLabel}</ButtonLink></article></Section>
    <Section eyebrow="PRACTICAL OUTCOMES" title="What the work may make clearer"><BulletGrid items={page.outcomes} /></Section>
    <Section eyebrow="SERVICE PROCESS" title={page.processTitle} muted><ProcessSteps steps={page.process} /></Section>
    {page.faqs.length ? <Section eyebrow="QUESTIONS BEFORE YOU REQUEST" title="Useful answers for this service"><FaqList items={page.faqs} /></Section> : null}
    <Section eyebrow="RELATED SERVICES" title="Continue exploring" muted><RelatedLinks links={page.related} /></Section>
    <ClosingCta description={`${page.preparation} Sending a request starts a conversation and does not confirm an appointment.`} label={page.ctaLabel} servicePath={page.path} title={page.ctaTitle} /></div>;
}

function SolutionPage({ page }: { page: SolutionRecord }) {
  return <div className="solution-detail"><Hero action={page.cta ? { label: page.cta.label, href: page.cta.href } : undefined} detail={page.audience} page={page} />
    <Section eyebrow="COMMON PRESSURES" title="Start with what gets in the way"><CardGrid items={page.challenges} /></Section>
    {page.pathways?.length ? <Section eyebrow="FIND THE CLOSEST SITUATION" title="Choose a useful starting point" muted><CardGrid items={page.pathways} /></Section> : null}
    {page.diagram ? <Section eyebrow="HOW TO THINK ABOUT THE SETUP" title={page.diagram.title}><ServiceDiagram diagram={page.diagram} /></Section> : null}
    {page.inclusions?.length && page.separateAgreement?.length ? <Section eyebrow="SCOPE AND BOUNDARIES" title="What help can include"><div className="service-scope-grid"><article><h3>Possible areas of help</h3><BulletGrid items={page.inclusions} /></article><article><h3>Needs separate agreement or another specialist</h3><BulletGrid items={page.separateAgreement} /></article></div>{page.delivery ? <div className="delivery-note"><h3>Remote and onsite suitability</h3><p>{page.delivery}</p></div> : null}</Section> : null}
    {page.example ? <Section eyebrow="ILLUSTRATIVE EXAMPLE" title="How the situation could be separated into practical steps" muted><article className="service-example"><div><h3>Situation</h3><p>{page.example.situation}</p></div><div><h3>Assessment and work</h3><p>{page.example.assessment}</p></div><div><h3>Possible deliverables</h3><ul>{page.example.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>{page.cta ? <ButtonLink href={page.cta.href}>{page.cta.label}</ButtonLink> : null}</article></Section> : null}
    <Section eyebrow="USEFUL PRIORITIES" title="Build around the work" muted><BulletGrid items={page.priorities} /></Section>
    <Section eyebrow="APPROACH" title="Move from context to practical action"><ProcessSteps steps={page.approach} /></Section>
    {page.faqs?.length ? <Section eyebrow="QUESTIONS BEFORE YOU REQUEST" title="Useful answers"><FaqList items={page.faqs} /></Section> : null}
    <Section eyebrow="RELATED PATHS" title="Services that may contribute" muted><RelatedLinks links={page.related} /></Section>
    <ClosingCta description={page.cta?.description} href={page.cta?.href} label={page.cta?.label} title={page.cta?.title} /></div>;
}

function HubPageView({ page }: { page: HubPage }) {
  const records = page.kind === "services-hub" ? services : solutions;
  if (page.kind === "services-hub") return <><Hero page={page} /><section className="service-directory section-space"><div className="container"><nav aria-label="Service goals" className="service-directory__jump">{serviceGroups.map((group) => <a href={`#${group.id}`} key={group.id}>{group.label}</a>)}</nav>{serviceGroups.map((group) => <section className={`service-directory__group service-directory__group--${group.accent}`} id={group.id} key={group.id}><div className="service-directory__intro"><p className="eyebrow">{group.label}</p><h2>{group.heading}</h2><p>{group.description}</p></div><div className="service-directory__cards">{group.services.map((record) => <Link className="service-directory__card" href={record.path} key={record.path}><div className="service-directory__icon"><Image alt="" fill sizes="120px" src={record.visual.src} /></div><div><h3>{record.name}</h3><strong className="service-directory__problem">{record.signals[0]}</strong><p>{record.description}</p><span>See how {record.name.toLowerCase()} can help <ArrowIcon diagonal /></span></div></Link>)}</div></section>)}<aside className="service-hub-guidance"><div><p className="eyebrow">NOT SURE WHERE TO START?</p><h2>Describe the problem in your own words.</h2><p>You do not need to diagnose the issue first. Share the situation, who it affects and what you need to do next; the service can be changed during the request.</p></div><ButtonLink href="/booking">Request a consultation</ButtonLink></aside></div></section><ClosingCta /></>;
  return <><Hero page={page} /><Section eyebrow="SITUATIONS" title="Find the path closest to your work">
    <div className="catalogue-grid">{records.map((record, index) => <Link aria-label={`Explore ${record.title}`} className="catalogue-card" href={record.path} key={record.path}><div className="catalogue-card__visual"><Image alt={record.visual.alt} fill sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, 390px" src={record.visual.src} /><span>{String(index + 1).padStart(2, "0")}</span></div><div className="catalogue-card__body"><h2>{record.title}</h2><p>{record.description}</p><strong>Explore {page.kind === "services-hub" ? "service" : "solution"} <ArrowIcon diagonal /></strong></div></Link>)}</div>
  </Section><ClosingCta /></>;
}

function InfoPageView({ page }: { page: InfoPage }) {
  const founderSection = page.path === "/about" ? page.sections?.find(({ title }) => title === "Meet the founder") : undefined;
  const sections = page.path === "/about" ? page.sections?.filter(({ title }) => title !== "Meet the founder") : page.sections;
  return <><Hero page={page} />
    {page.path === "/contact" ? <section className="contact-primary"><div className="container"><div><h2>Send a secure enquiry</h2><p>Use the full request form for IT help, a project, a quote or a consultation. Your request will be reviewed before any appointment, scope or price is agreed.</p></div><ButtonLink href="/booking">Request a consultation</ButtonLink></div></section> : null}
    {page.path === "/support" ? <section className="support-request support-request--priority" id="request-support"><div className="container support-request__grid"><div className="support-request__intro"><p className="eyebrow"><span className="eyebrow-line" />REQUEST SUPPORT</p><h2>Tell us what is happening.</h2><p>Share a safe summary for review. Sending this request does not confirm an appointment, service availability or a response time.</p><p className="support-request__safety"><strong>Keep secrets out of the form.</strong> Do not include passwords, MFA codes, recovery keys, payment-card details or confidential customer information.</p></div><div className="support-request__form"><Suspense fallback={<p>Loading request form…</p>}><SupportRequestForm /></Suspense></div></div></section> : null}
    {page.path === "/about" ? <section className="about-story"><div className="container about-story__grid"><div><p className="eyebrow"><span className="eyebrow-line" />WHY BOOMOTECH</p><h2>Technical capability should make the next decision clearer.</h2><p>BoomoTech connects hands-on problem solving with thoughtful systems work. The goal is to understand what matters, explain the trade-offs and build a practical path forward.</p></div><OrbitDiagram centre="BoomoTech" label="BoomoTech approach: Listen, Clarify and Build" stages={[{ label: "Listen", description: "Understand the people, problem and impact before choosing a tool." }, { label: "Clarify", description: "Make the options, dependencies and boundaries easier to understand." }, { label: "Build", description: "Deliver an agreed practical step and review what comes next." }]} variant="about" /></div></section> : null}
    {page.path === "/pricing" ? <PricingOverview /> : null}
    {page.path === "/learning" ? <LearningPortal /> : null}
    {founderSection?.description ? <FounderProfile description={founderSection.description} /> : null}
    {page.notice ? <div className="container notice-wrap"><Notice {...page.notice} /></div> : null}
    {page.resources?.length ? <Resources page={page} /> : null}
    {page.cards?.length ? <Section eyebrow="AT A GLANCE" title="Choose a useful starting point"><CardGrid items={page.cards} /></Section> : null}
    {sections?.map((section, index) => <Section eyebrow={`${String(index + 1).padStart(2, "0")} / GUIDANCE`} key={section.title} muted={index % 2 === 0} title={section.title}>
      {section.description ? <p className="prose-lead">{section.description}</p> : null}{section.items ? <BulletGrid items={section.items} /> : null}
    </Section>)}
    {page.process?.length ? <Section eyebrow="HOW TO PREPARE" title="Build a useful brief" muted><ProcessSteps steps={page.process} /></Section> : null}
    {page.faqs?.length ? <Section eyebrow="QUESTIONS" title="Useful answers"><FaqList items={page.faqs} /></Section> : null}
    {page.related?.length ? <Section eyebrow="CONTINUE EXPLORING" title="Related information" muted><RelatedLinks links={page.related} /></Section> : null}
    {page.path === "/support" ? null : page.cta ? <ClosingCta description={page.cta.description} href={page.cta.href} label={page.cta.label} /> : page.kind !== "legal" ? <ClosingCta intent={page.path === "/get-a-quote" ? "quote" : "consultation"} label={page.path === "/get-a-quote" ? "Request a quote" : undefined} /> : null}
  </>;
}

export function PageRenderer({ page }: { page: PageRecord }) {
  const siteUrl = getSiteUrl();
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: new URL("/", siteUrl).toString() }, ...page.path.split("/").filter(Boolean).map((part, index, parts) => ({ "@type": "ListItem", position: index + 2, name: index === parts.length - 1 ? page.title : part.replaceAll("-", " "), item: new URL(`/${parts.slice(0, index + 1).join("/")}`, siteUrl).toString() }))] };
  const structured: Array<Record<string, unknown>> = [breadcrumbs];
  if (page.kind === "service") structured.push({
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.name,
    description: page.metaDescription,
    url: new URL(page.path, siteUrl).toString(),
    provider: { "@type": "Organization", name: businessIdentity.tradingName, url: siteUrl.toString() },
    areaServed: [{ "@type": "City", name: businessIdentity.baseLocality }, { "@type": "Country", name: businessIdentity.remoteArea }],
    audience: { "@type": "Audience", audienceType: page.audience },
  });
  let content: React.ReactNode;
  switch (page.kind) {
    case "service": content = <ServicePage page={page} />; break;
    case "solution": content = <SolutionPage page={page} />; break;
    case "services-hub":
    case "solutions-hub": content = <HubPageView page={page} />; break;
    default: content = <InfoPageView page={page} />;
  }
  return <><script dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replaceAll("<", "\\u003c") }} type="application/ld+json" />{content}</>;
}
