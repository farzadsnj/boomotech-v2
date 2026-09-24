import { site } from "@/content/site";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ChatBookingButton } from "./chat-booking-button";
import { NavigationLink } from "./navigation-link";
import { MobileNavigation } from "./mobile-navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <BrandLogo />
        <nav aria-label="Primary" className="desktop-nav">
          {site.navigation.map((item) => <NavigationLink key={item.href} href={item.href}>{item.label}</NavigationLink>)}
        </nav>
        <ChatBookingButton />
        <MobileNavigation />
      </div>
    </header>
  );
}
