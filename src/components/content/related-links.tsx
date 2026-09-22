import Link from "next/link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import type { SiteLink } from "@/content/types";

export function RelatedLinks({ links }: { links: SiteLink[] }) {
  return <div className="related-grid">{links.map((link) => <Link href={link.href} key={link.href}><span>{link.label}</span><ArrowIcon diagonal /></Link>)}</div>;
}
