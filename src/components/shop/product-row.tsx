"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/content/products";
import { ProductCard } from "./product-card";

export function ProductRow({ eyebrow, id, products, title }: { eyebrow: string; id: string; products: Product[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ start: true, end: false, scrollable: false });

  const update = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const maximum = Math.max(0, node.scrollWidth - node.clientWidth);
    setPosition({ start: node.scrollLeft <= 3, end: node.scrollLeft >= maximum - 3, scrollable: maximum > 3 });
  }, []);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [update]);

  function move(direction: -1 | 1) {
    const node = track.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * node.clientWidth * 0.88, behavior: reduced ? "auto" : "smooth" });
  }

  return <section className="shop-section" aria-labelledby={id}>
    <div className="shop-section__heading"><div><p className="eyebrow"><span className="eyebrow-line" />{eyebrow}</p><h2 id={id}>{title}</h2></div><Link href="/shop?view=all">View all products</Link></div>
    <div className="product-row-shell">
      {position.scrollable ? <div className="product-row-controls" aria-label={`${title} controls`}><button aria-label={`Previous ${title}`} disabled={position.start} onClick={() => move(-1)} type="button">←</button><button aria-label={`Next ${title}`} disabled={position.end} onClick={() => move(1)} type="button">→</button></div> : null}
      <div className="product-row" data-testid="product-row" onScroll={update} ref={track}>{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      {position.scrollable ? <p className="product-row-hint">Swipe or use the controls to see more products.</p> : null}
    </div>
  </section>;
}
