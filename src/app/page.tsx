import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { HeroVisual } from "@/components/home/hero-visual";
import { ServicePathfinder } from "@/components/home/service-pathfinder";
import { homeContent } from "@/content/site";
import { serviceGroups } from "@/content/service-groups";
import { featuredWorkFallback } from "@/content/featured-work";
import { calculateReadingTime, publishedArticles } from "@/content/blog";

const trustItems = ["Brisbane based", "Remote options across Australia", "Clear scope before work begins", "Support, systems and digital projects"];
const faqs = [
  ["Where should I start if I do not know the technical cause?", "Start with the impact: what is affected, when it began and what you need to do next. The service pathfinder and support guidance can help narrow the next step."],
  ["Does a consultation request confirm an appointment?", "No. It sends a secure request for review. Availability, scope and next steps are discussed before an appointment is confirmed."],
  ["Can BoomoTech help outside Brisbane?", "BoomoTech is Brisbane based and remote options are available across Australia where suitable. Onsite scope is confirmed case by case."],
  ["What should I avoid sharing through the website?", "Never send passwords, MFA codes, recovery keys, private keys or full payment-card details."]
] as const;

export default function HomePage() {
  return <>
    <section className="hero professional-hero"><div className="hero__grid container"><div className="hero__copy">
      <p className="eyebrow hero-stagger hero-stagger--1"><span className="eyebrow-line" />{homeContent.eyebrow}</p>
      <h1 className="hero-stagger hero-stagger--2">Technology that works today.<br /><em>Systems ready for tomorrow.</em></h1>
      <p className="hero__lead hero-stagger hero-stagger--3">Practical Brisbane-based help for IT problems, cloud, security, websites and smarter workflows, with remote options across Australia.</p>
      <div className="hero__actions hero-stagger hero-stagger--4"><ButtonLink href="/support">Get IT help</ButtonLink><ButtonLink href="/booking" variant="secondary">Plan a project</ButtonLink></div>
      <p className="hero__note hero-stagger hero-stagger--5"><span aria-hidden="true" className="status-dot" />Start with the problem. Understand the next step before work begins.</p>
    </div><HeroVisual /></div><div className="trust-rail" aria-label="Service context"><div className="container">{trustItems.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>)}</div></div></section>

    <section className="section-space pathfinder-section"><Reveal className="container"><ServicePathfinder /></Reveal></section>

    <section className="section-space capability-section"><Reveal className="container"><div className="capability-section__header"><SectionHeading eyebrow="CAPABILITIES" title="Support, secure, improve and build." description="One connected view of the technology that keeps work moving and creates room to improve." /><Link className="text-link" href="/services">Explore every service <ArrowIcon diagonal /></Link></div><div className="capability-bento">{serviceGroups.map((group, index) => <article className={`capability-card capability-card--${group.accent} capability-card--${index + 1}`} key={group.id}><div className="capability-card__index">0{index + 1}</div><p className="capability-card__label">{group.label}</p><h3>{group.heading}</h3><p>{group.description}</p><ul>{group.services.map((service) => <li key={service.path}><Link href={service.path}>{service.name}<ArrowIcon diagonal /></Link></li>)}</ul></article>)}</div></Reveal></section>

    <section className="section-space work-section"><Reveal className="container work-section__grid"><div className="work-visual" aria-hidden="true"><span>Understand</span><span>Plan</span><span>Improve</span><i /></div><div><p className="eyebrow"><span className="eyebrow-line" />{featuredWorkFallback.eyebrow}</p><h2>{featuredWorkFallback.title}</h2><p>{featuredWorkFallback.description}</p><Link className="text-link" href={featuredWorkFallback.action.href}>{featuredWorkFallback.action.label}<ArrowIcon diagonal /></Link></div></Reveal></section>

    <section className="section-space health-promo"><Reveal className="container health-promo__inner"><div><p className="eyebrow"><span className="eyebrow-line" />FREE IT HEALTH CHECK</p><h2>Ten questions. A clearer list of priorities.</h2><p>Review the foundations around access, devices, backups, security and support. Answers stay in your browser and the result is immediate.</p><ButtonLink href="/tools/it-health-check">Start the health check</ButtonLink></div><div className="health-promo__dial" aria-hidden="true"><div><span>10</span><small>practical<br />questions</small></div></div></Reveal></section>

    <section className="process-section section-space"><Reveal className="container process-section__grid"><div className="process-section__intro"><SectionHeading eyebrow="A CLEAR WAY FORWARD" title="Good technology work starts with context." description="Understand the need, agree a practical path, then make the change with the right safeguards." light /><ButtonLink href="/about" variant="light">How BoomoTech works</ButtonLink></div><ol className="process-list">{homeContent.process.map((step) => <li key={step.number}><span className="process-list__number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol></Reveal></section>

    <section className="section-space resource-preview"><Reveal className="container"><div className="resource-preview__header"><SectionHeading eyebrow="PRACTICAL RESOURCES" title="Make the next technology decision with more context." description="Clear guides written for small businesses and people who need useful answers without unnecessary jargon." /><Link className="text-link" href="/blog">Browse all articles <ArrowIcon diagonal /></Link></div><div className="resource-preview__grid">{publishedArticles.map((article) => <article key={article.slug}><p>{article.category} · {calculateReadingTime(article)}</p><h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link className="text-link" href={`/blog/${article.slug}`}>Read article <ArrowIcon diagonal /></Link></article>)}</div></Reveal></section>

    <section className="section-space home-faq"><Reveal className="container home-faq__grid"><div><p className="eyebrow"><span className="eyebrow-line" />USEFUL ANSWERS</p><h2>Know what to expect before you begin.</h2><p>Clear boundaries are part of a useful technology conversation.</p><Link className="text-link" href="/faq">View all FAQs <ArrowIcon diagonal /></Link></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></Reveal></section>

    <section className="closing-section section-space"><Reveal className="container closing-section__inner"><div><p className="eyebrow"><span className="eyebrow-line" />READY FOR A CLEARER NEXT STEP?</p><h2>Bring the problem, decision or idea.</h2><p>BoomoTech will help you identify a practical path without pretending every situation has the same answer.</p></div><div className="closing-section__actions"><ButtonLink href="/support">Get IT help</ButtonLink><ButtonLink href="/booking" variant="secondary">Book a consultation</ButtonLink></div></Reveal></section>
  </>;
}
