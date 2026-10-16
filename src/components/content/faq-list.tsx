import type { Faq } from "@/content/types";
import Link from "next/link";

export function FaqList({ items }: { items: Faq[] }) {
  return <div className="faq-list">{items.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><div className="faq-list__answer"><p>{item.answer}</p>{item.links?.length ? <ul aria-label="Related pages">{item.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul> : null}</div></details>)}</div>;
}
