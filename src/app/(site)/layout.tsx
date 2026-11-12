import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CookieNotice } from "@/components/privacy/cookie-notice";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { Chatbot } from "@/features/chat/chatbot";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { site } from "@/content/site";
import { businessIdentity } from "@/content/business";
import { getSiteUrl } from "@/lib/site-url";
import { isAiChatEnabled, isShopEnabled } from "@/lib/config/features";
import { EnquiryContextProvider } from "@/features/enquiry/context";
import "../globals.css";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const aiEnabled = isAiChatEnabled();
  const shopEnabled = isShopEnabled();
  const organisation = { "@context": "https://schema.org", "@type": "Organization", name: businessIdentity.tradingName, url: getSiteUrl().toString(), logo: new URL("/brand/boomotech-logo.png", getSiteUrl()).toString(), description: site.description, founder: { "@type": "Person", name: businessIdentity.founderName }, areaServed: [{ "@type": "City", name: businessIdentity.baseLocality }, { "@type": "Country", name: businessIdentity.remoteArea }] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, "\\u003c") }} />
    <EnquiryContextProvider>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader shopEnabled={shopEnabled} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter shopEnabled={shopEnabled} />
      <ScrollToTop />
      <Chatbot aiEnabled={aiEnabled} />
      <CookieNotice />
      <RevealObserver />
    </EnquiryContextProvider>
  </>;
}
