import Image from "next/image";
import Link from "next/link";

type Props = { compact?: boolean; footer?: boolean };

export function BrandLogo({ compact = false, footer = false }: Props) {
  return (
    <Link aria-label="BoomoTech home" className={`brand-logo ${footer ? "brand-logo--footer" : ""}`} href="/">
      {footer ? (
        <Image alt="BoomoTech" height={682} priority={false} src="/brand/boomotech-logo.png" width={768} />
      ) : (
        <>
          <Image alt="" aria-hidden="true" height={512} priority src="/brand/boomotech-mark.png" width={512} />
          {!compact ? <span>BoomoTech</span> : null}
        </>
      )}
    </Link>
  );
}
