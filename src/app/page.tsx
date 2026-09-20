import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { PathwayIcon } from "@/components/ui/pathway-icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { homeContent } from "@/content/site";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__grid container">
          <div className="hero__copy">
            <p className="eyebrow"><span className="eyebrow-line" />{homeContent.eyebrow}</p>
            <h1>{homeContent.headline}</h1>
            <p className="hero__lead">{homeContent.introduction}</p>
            <div className="hero__actions">
              <ButtonLink href={homeContent.primaryAction.href}>{homeContent.primaryAction.label}</ButtonLink>
              <ButtonLink href={homeContent.secondaryAction.href} variant="secondary">{homeContent.secondaryAction.label}</ButtonLink>
            </div>
            <p className="hero__note"><span aria-hidden="true" className="status-dot" />Clear next steps for real technology challenges.</p>
          </div>
          <div aria-hidden="true" className="hero-visual">
            <div className="hero-visual__orbit hero-visual__orbit--one" />
            <div className="hero-visual__orbit hero-visual__orbit--two" />
            <div className="hero-visual__top"><span className="visual-symbol">B<span>.</span></span><span>CONNECTED THINKING</span></div>
            <div className="hero-visual__core">
              <div className="hero-visual__core-icon"><span /><span /><span /></div>
              <p>Make technology<br /><strong>work better.</strong></p>
            </div>
            <div className="hero-visual__chip hero-visual__chip--top"><span className="chip-icon chip-icon--blue" />SUPPORT</div>
            <div className="hero-visual__chip hero-visual__chip--left"><span className="chip-icon chip-icon--teal" />IMPROVE</div>
            <div className="hero-visual__chip hero-visual__chip--right"><span className="chip-icon chip-icon--orange" />CREATE</div>
            <div className="hero-visual__bottom"><span>01 / PRACTICAL HELP</span><span>02 / SMARTER SYSTEMS</span></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="pathways-title" className="pathways section-space">
        <div className="container">
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
        </div>
      </section>

      <section className="services-section section-space">
        <div className="container">
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
        </div>
      </section>

      <section className="process-section section-space">
        <div className="container process-section__grid">
          <div className="process-section__intro">
            <SectionHeading eyebrow="A CLEARER WAY FORWARD" title="Good help starts with understanding." description="Technology decisions can feel complicated. The first step should not." light />
            <ButtonLink href="/about" variant="light">How BoomoTech works</ButtonLink>
          </div>
          <ol className="process-list">
            {homeContent.process.map((step) => (
              <li key={step.number}><span className="process-list__number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="closing-section section-space">
        <div className="container closing-section__inner">
          <div><p className="eyebrow"><span className="eyebrow-line" />READY FOR THE NEXT STEP?</p><h2>Let’s make your technology easier to work with.</h2><p>Start with a support need or explore a conversation about what comes next.</p></div>
          <div className="closing-section__actions"><ButtonLink href="/support">Get IT help</ButtonLink><ButtonLink href="/book" variant="secondary">Explore consultation</ButtonLink></div>
        </div>
      </section>
    </>
  );
}
