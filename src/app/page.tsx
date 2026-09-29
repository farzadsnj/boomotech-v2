import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { PathwayIcon } from "@/components/ui/pathway-icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { homeContent } from "@/content/site";
import { Reveal } from "@/components/motion/reveal";
import { HeroVisual } from "@/components/home/hero-visual";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__grid container">
          <div className="hero__copy">
            <p className="eyebrow hero-stagger hero-stagger--1"><span className="eyebrow-line" />{homeContent.eyebrow}</p>
            <h1 className="hero-stagger hero-stagger--2">{homeContent.headline}</h1>
            <p className="hero__lead hero-stagger hero-stagger--3">{homeContent.introduction}</p>
            <div className="hero__actions hero-stagger hero-stagger--4">
              <ButtonLink href={homeContent.primaryAction.href}>{homeContent.primaryAction.label}</ButtonLink>
              <ButtonLink href={homeContent.secondaryAction.href} variant="secondary">{homeContent.secondaryAction.label}</ButtonLink>
            </div>
            <p className="hero__note hero-stagger hero-stagger--5"><span aria-hidden="true" className="status-dot" />Clear next steps for real technology challenges.</p>
          </div>
          <HeroVisual />
        </div>
        <div className="hero-trust container" aria-label="Service context"><span>Brisbane based</span><span>Remote support across Australia</span><span>Clear scope before work begins</span></div>
      </section>

      <section aria-labelledby="pathways-title" className="pathways section-space">
        <Reveal className="container">
          <div className="section-intro">
            <div><p className="eyebrow"><span className="eyebrow-line" />START WITH YOUR NEED</p><h2 id="pathways-title">What brings you here?</h2></div>
            <p>Choose the path that feels closest. You do not need to know the technical answer first.</p>
          </div>
          <div className="pathway-grid">
            {homeContent.pathways.map((pathway) => (
              <Link className="pathway-card" href={pathway.href} key={pathway.number}>
                <div className="pathway-card__top"><PathwayIcon name={pathway.icon} /><span>{pathway.number}</span></div>
                <h3>{pathway.title}</h3>
                <p>{pathway.description}</p>
                <span className="pathway-card__action">{pathway.action}<ArrowIcon diagonal /></span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="services-section section-space">
        <Reveal className="container">
          <div className="services-section__header">
            <SectionHeading eyebrow="WHAT WE CAN EXPLORE" title="Support for today. Better systems for tomorrow." description="From the issue that needs attention now to the project that could change how you work." />
            <Link className="text-link" href="/services">Explore all services <ArrowIcon diagonal /></Link>
          </div>
          <div className="service-grid">
            {homeContent.serviceGroups.map((group) => (
              <article className="service-card" key={group.number}>
                <p className="service-card__number">{group.number}</p>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
                <ul>{group.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}<ArrowIcon diagonal /></Link></li>)}</ul>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="process-section section-space">
        <Reveal className="container process-section__grid">
          <div className="process-section__intro">
            <SectionHeading eyebrow="A CLEARER WAY FORWARD" title="Good help starts with understanding." description="Technology decisions can feel complicated. The first step should not." light />
            <ButtonLink href="/about" variant="light">How BoomoTech works</ButtonLink>
          </div>
          <ol className="process-list">
            {homeContent.process.map((step) => (
              <li key={step.number}><span className="process-list__number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="closing-section section-space">
        <Reveal className="container closing-section__inner">
          <div><p className="eyebrow"><span className="eyebrow-line" />READY FOR THE NEXT STEP?</p><h2>Let’s make your technology easier to work with.</h2><p>Start with a support need or explore a conversation about what comes next.</p></div>
          <div className="closing-section__actions"><ButtonLink href="/support">Get IT help</ButtonLink><ButtonLink href="/booking" variant="secondary">Book a Consultation</ButtonLink></div>
        </Reveal>
      </section>
    </>
  );
}
