import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { pricingOptions, pricingPrinciples } from "@/content/pricing";

export function PricingOverview() {
  return <>
    <section className="pricing-intro"><div className="container pricing-intro__grid"><div><p className="eyebrow"><span className="eyebrow-line" />PRICING APPROACH</p><h2>Clear scope before a final price.</h2></div><p>BoomoTech has not published fixed rates for these services. Each option below explains how pricing is prepared, what may be included and what must be confirmed before work begins.</p></div></section>
    <section className="pricing-section"><div className="container pricing-grid">{pricingOptions.map((option) => <article className="pricing-card" key={option.title}>
      <p className="pricing-card__basis">{option.pricingBasis}</p><h2>{option.title}</h2><p>{option.summary}</p>
      <h3>Possible inclusions</h3><ul>{option.includes.map((item) => <li key={item}>{item}</li>)}</ul>
      <p className="pricing-card__condition">{option.conditions}</p>
      <div className="pricing-card__actions"><Link href={option.servicePath}>View details <ArrowIcon diagonal /></Link><ButtonLink bookingIntent="quote" bookingService={option.servicePath} href="/booking">Request a quote</ButtonLink></div>
    </article>)}</div></section>
    <section className="pricing-principles"><div className="container pricing-principles__grid"><div><p className="eyebrow"><span className="eyebrow-line" />BEFORE WORK BEGINS</p><h2>What to expect from a quote.</h2></div><ul>{pricingPrinciples.map((item) => <li key={item}>{item}</li>)}</ul></div></section>
  </>;
}
