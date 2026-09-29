import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { ProductCard } from "@/components/shop/product-card";
import { ButtonLink } from "@/components/ui/button-link";
import { categoryBySlug, productBySlug, products } from "@/content/products";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return products.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = productBySlug.get((await params).slug);
  if (!product) return {};
  return { title: product.name, description: product.description, alternates: { canonical: `/shop/${product.slug}` }, robots: { index: false, follow: false } };
}

export default async function ProductPage({ params }: Props) {
  const product = productBySlug.get((await params).slug);
  if (!product) notFound();
  const category = categoryBySlug.get(product.category)!;
  const related = [...products.filter((item) => item.category === product.category && item.slug !== product.slug), ...products.filter((item) => item.category !== product.category && item.slug !== product.slug)].slice(0, 4);
  return <>
    <header className="product-hero"><div className="container"><Breadcrumbs path={`/shop/${product.slug}`} title={product.name} /><div className="product-hero__grid">
      <div className="product-gallery"><Image alt={`${product.name} sample catalogue illustration`} fill priority sizes="(max-width: 760px) 92vw, 560px" src={product.image} /></div>
      <div className="product-summary"><p className="eyebrow"><span className="eyebrow-line" />{category.name}</p><h1>{product.name}</h1><p className="product-summary__description">{product.description}</p><p className="product-summary__price">{new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(product.priceAud)} <span>sample price</span></p><p className="product-card__stock"><span aria-hidden="true" /> Availability to be confirmed</p><div className="catalogue-notice"><strong>Catalogue preview</strong><span>This item cannot be ordered online. Final model, price, stock, warranty and fulfilment terms require approval.</span></div><ButtonLink bookingService="/services/it-support" href="/booking">Ask about equipment and setup</ButtonLink></div>
    </div></div></header>
    <div className="container product-main">
      <section className="product-details"><div><p className="eyebrow"><span className="eyebrow-line" />Key features</p><h2>What this sample configuration includes</h2><ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div><div><p className="eyebrow"><span className="eyebrow-line" />Technical overview</p><h2>Specifications</h2><dl>{Object.entries(product.specifications).map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl></div></section>
      {related.length ? <section className="shop-section" aria-labelledby="related-products"><div className="shop-section__heading"><div><p className="eyebrow"><span className="eyebrow-line" />Related products</p><h2 id="related-products">Continue comparing</h2></div></div><div className="product-grid">{related.map((item) => <ProductCard key={item.slug} product={item} />)}</div></section> : null}
      <Link className="shop-back-link" href="/shop">← Back to shop</Link>
    </div>
  </>;
}
