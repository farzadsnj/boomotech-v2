import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CookieNotice } from "@/components/privacy/cookie-notice";
import { PageTransition } from "@/components/motion/page-transition";
import { Chatbot } from "@/features/chat/chatbot";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { site } from "@/content/site";
import { getSiteUrl, isIndexingEnabled } from "@/lib/site-url";
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

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "BoomoTech | Practical technology help", template: "%s | BoomoTech" },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "BoomoTech | Practical technology help",
    description: site.description,
    url: "/",
  },
  robots: { index: isIndexingEnabled(), follow: isIndexingEnabled() },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "const root=document.documentElement;root.classList.add('motion-enabled');setTimeout(()=>{if(!root.dataset.motionHydrated)root.classList.remove('motion-enabled')},1500)" }} />
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important}`}</style></noscript>
      </head>
      <body className={`${inter.variable} ${manrope.variable}`} style={{ "--font-body": inter.style.fontFamily, "--font-display": manrope.style.fontFamily } as CSSProperties}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}><PageTransition>{children}</PageTransition></main>
        <SiteFooter />
        <ScrollToTop />
        <Chatbot />
        <CookieNotice />
      </body>
    </html>
  );
}
