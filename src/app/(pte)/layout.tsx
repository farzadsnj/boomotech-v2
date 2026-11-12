import type { Metadata } from "next";
import "./pte-root.css";

export const metadata: Metadata = { title: { default: "PTEpath by BoomoTech", template: "%s | PTEpath" }, icons: { icon: "/ptepath-favicon.svg", shortcut: "/ptepath-favicon.svg" } };

export default function PteLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <div className="pte-route-root">{children}</div>; }
