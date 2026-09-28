import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { ShopSearch } from "@/components/shop/shop-search";
import { productCategories, products, searchProducts } from "@/content/products";

export const metadata: Metadata = {
  title: "Technology shop preview",
  description: "Explore the sample BoomoTech technology catalogue for computers, networking, security and practical office equipment.",
  alternates: { canonical: "/shop" },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> };

function valueOf(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = valueOf(params.q).slice(0, 100);
  const requestedCategory = valueOf(params.category);
  const category = productCategories.some(({ slug }) => slug === requestedCategory) ? requestedCategory : "all";
  const results = searchProducts(query, category);
  const filtered = Boolean(query || category !== "all");
  const featured = products.filter(({ featured }) => featured);
  const newest = products.filter(({ isNew }) => isNew);
  const recommended = products.filter(({ recommended }) => recommended);

  return <>
    <header className="shop-hero">
      <div className="container shop-hero__grid">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />BoomoTech shop preview</p>
          <h1>Technology selected around how you work.</h1>
          <p>Explore a sample catalogue designed around compatibility, setup and practical support. Product details, suppliers, availability and sales terms still require owner approval.</p>
        </div>
        <div className="shop-hero__art" aria-hidden="true"><Image alt="" fill priority sizes="(max-width: 760px) 90vw, 520px" src="/products/networking.svg" /></div>
      </div>
      <div className="container"><ShopSearch category={category} query={query} /></div>
    </header>

    <div className="shop-main container">
      <div className="catalogue-notice" role="note"><strong>Sample catalogue</strong><span>Products, prices and availability are placeholders for layout review. Online ordering is not available.</span></div>
      {filtered ? <section className="shop-section" aria-labelledby="search-results-title">
        <div className="shop-section__heading"><div><p className="eyebrow"><span className="eyebrow-line" />Search results</p><h2 id="search-results-title">{results.length ? `${results.length} product${results.length === 1 ? "" : "s"} found` : "No matching products"}</h2></div></div>
        {results.length ? <div className="product-grid">{results.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="shop-empty"><h3>Try a broader search</h3><p>Check the spelling, use fewer words or explore all product categories.</p><Link className="button-link button-link--primary inline-flex items-center" href="/shop">Clear active search</Link></div>}
      </section> : <>
        <section className="shop-section" aria-labelledby="categories-title">
          <div className="shop-section__heading"><div><p className="eyebrow"><span className="eyebrow-line" />Browse by need</p><h2 id="categories-title">Product categories</h2></div></div>
          <div className="shop-category-grid">{productCategories.map((item) => <Link className="shop-category-card" href={`/shop?category=${item.slug}`} key={item.slug}><Image alt="" aria-hidden="true" height={180} src={item.image} width={260} /><div><h3>{item.name}</h3><p>{item.description}</p><strong>View all</strong></div></Link>)}</div>
        </section>
        <ProductRow eyebrow="Featured" id="featured-products" products={featured} title="A practical starting point" />
        <ProductRow eyebrow="New to the sample catalogue" id="new-products" products={newest} title="Latest product concepts" />
        <ProductRow eyebrow="Recommended for comparison" id="recommended-products" products={recommended} title="Products to explore with advice" />
      </>}
    </div>
  </>;
}

function ProductRow({ eyebrow, id, products: items, title }: { eyebrow: string; id: string; products: typeof products; title: string }) {
  return <section className="shop-section" aria-labelledby={id}><div className="shop-section__heading"><div><p className="eyebrow"><span className="eyebrow-line" />{eyebrow}</p><h2 id={id}>{title}</h2></div><Link href="/shop?category=all">View all products</Link></div><div className="product-row">{items.map((product) => <ProductCard key={product.slug} product={product} />)}</div></section>;
}
