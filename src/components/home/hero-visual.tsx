import Image from "next/image";

const categories = [
  { className: "top", label: "IT support" },
  { className: "left", label: "Networks + M365" },
  { className: "right", label: "Security + backups" },
  { className: "bottom", label: "Web + automation" },
] as const;

export function HeroVisual() {
  return <div aria-hidden="true" className="hero-visual" data-testid="hero-visual">
    <div className="hero-visual__orbit hero-visual__orbit--one" />
    <div className="hero-visual__orbit hero-visual__orbit--two" />
    <div className="hero-visual__core">
      <Image alt="" className="hero-visual__brand-mark" height={512} priority src="/brand/boomotech-mark.png" width={512} />
      <p>Support, secure,<br /><strong>improve and build.</strong></p>
    </div>
    {categories.map((category) => <div className={`hero-visual__chip hero-visual__chip--${category.className}`} key={category.label}>{category.label}</div>)}
  </div>;
}
