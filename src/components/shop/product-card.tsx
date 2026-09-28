import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { categoryBySlug, type Product } from "@/content/products";

export function ProductCard({ product, headingLevel = 3 }: { product: Product; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const category = categoryBySlug.get(product.category);
  return (
    <article className="product-card">
      <Link className="product-card__link" href={`/shop/${product.slug}`} aria-label={`View ${product.name}`}>
        <div className="product-card__image"><Image alt="" aria-hidden="true" fill sizes="(max-width: 640px) 84vw, (max-width: 1024px) 42vw, 280px" src={product.image} /></div>
        <div className="product-card__body">
          <p className="product-card__category">{category?.name}</p>
          <Heading>{product.name}</Heading>
          <p className="product-card__description">{product.description}</p>
          <p className="product-card__spec">{product.features[0]}</p>
          <div className="product-card__footer">
            <div><strong>{new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(product.priceAud)}</strong><small>Sample price</small></div>
            <span>View details <ArrowIcon diagonal /></span>
          </div>
          <p className="product-card__stock"><span aria-hidden="true" /> Availability to be confirmed</p>
        </div>
      </Link>
    </article>
  );
}
