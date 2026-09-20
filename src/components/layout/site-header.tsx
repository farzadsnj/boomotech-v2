import Link from "next/link";
import { site } from "@/content/site";
import { ArrowIcon } from "@/components/ui/arrow-icon";

function Brand() {
  return (
    <Link aria-label="BoomoTech home" className="brand" href="/">
      <span aria-hidden="true" className="brand-mark"><i /><i /><i /></span>
      <span>Boomo<span className="brand-accent">Tech</span></span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Brand />
        <nav aria-label="Primary" className="desktop-nav">
          {site.navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <Link className="header-cta" href="/book">Book a consultation <ArrowIcon diagonal /></Link>
        <details className="mobile-nav">
          <summary aria-label="Toggle navigation"><span className="mobile-nav__label">Menu</span><span aria-hidden="true" className="menu-lines"><i /><i /></span></summary>
          <nav aria-label="Mobile primary">
            {site.navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}<ArrowIcon diagonal /></Link>)}
            <Link className="mobile-nav__cta" href="/book">Book a consultation<ArrowIcon diagonal /></Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
