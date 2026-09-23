import { site } from "@/content/site";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MobileNavigation } from "./mobile-navigation";
import { NavigationLink } from "./navigation-link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <BrandLogo />
        <nav aria-label="Primary" className="desktop-nav">
          {site.navigation.map((item) => <NavigationLink key={item.href} href={item.href}>{item.label}</NavigationLink>)}
        </nav>
        <NavigationLink className="header-cta" href="/book">Explore consultation <ArrowIcon diagonal /></NavigationLink>
        <MobileNavigation />
      </div>
    </header>
  );
}
