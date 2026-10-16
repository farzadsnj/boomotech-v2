import type { CSSProperties } from "react";
import { Inter, Manrope } from "next/font/google";
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
import { siteMetadata } from "@/lib/site-metadata";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata = siteMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const aiEnabled = isAiChatEnabled();
  const shopEnabled = isShopEnabled();
  const organisation = { "@context": "https://schema.org", "@type": "Organization", name: businessIdentity.tradingName, url: getSiteUrl().toString(), logo: new URL("/brand/boomotech-logo.png", getSiteUrl()).toString(), description: site.description, founder: { "@type": "Person", name: businessIdentity.founderName }, areaServed: [{ "@type": "City", name: businessIdentity.baseLocality }, { "@type": "Country", name: businessIdentity.remoteArea }] };
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "const root=document.documentElement;root.classList.add('motion-enabled');setTimeout(()=>{if(!root.dataset.motionHydrated)root.classList.remove('motion-enabled')},1500)" }} />
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important}`}</style></noscript>
      </head>
      <body className={`${inter.variable} ${manrope.variable}`} style={{ "--font-body": inter.style.fontFamily, "--font-display": manrope.style.fontFamily } as CSSProperties}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, "\\u003c") }} />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader shopEnabled={shopEnabled} />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter shopEnabled={shopEnabled} />
        <ScrollToTop />
        <Chatbot aiEnabled={aiEnabled} />
        <CookieNotice />
        <RevealObserver />
      </body>
    </html>
  );
}
