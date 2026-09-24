import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageTransition } from "@/components/motion/page-transition";
import { Chatbot } from "@/features/chat/chatbot";
import { site } from "@/content/site";
import { getSiteUrl, isIndexingEnabled } from "@/lib/site-url";
import "./globals.css";

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
    <html lang="en-AU">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}><PageTransition>{children}</PageTransition></main>
        <SiteFooter />
        <Chatbot />
      </body>
    </html>
  );
}
