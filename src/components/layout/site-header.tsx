import Link from "next/link";
import { site } from "@/content/site";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileNavigation } from "./mobile-navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <BrandLogo />
        <nav aria-label="Primary" className="desktop-nav">
          {site.navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <Link className="header-cta" href="/book">Explore consultation <ArrowIcon diagonal /></Link>
        <MobileNavigation />
      </div>
    </header>
  );
}
