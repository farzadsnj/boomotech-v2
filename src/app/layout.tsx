import type { CSSProperties } from "react";
import { DM_Sans, Inter, Manrope } from "next/font/google";
import { siteMetadata } from "@/lib/site-metadata";

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

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata = siteMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} ${dmSans.variable}`} style={{ "--font-body": inter.style.fontFamily, "--font-display": manrope.style.fontFamily, "--font-pte-body": dmSans.style.fontFamily } as CSSProperties}>{children}</body>
    </html>
  );
}
