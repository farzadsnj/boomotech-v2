import Link from "next/link";
import { ArrowIcon } from "./arrow-icon";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", className = "" }: Props) {
  return (
    <Link className={`button-link inline-flex items-center button-link--${variant} ${className}`.trim()} href={href}>
      <span>{children}</span>
      <ArrowIcon />
    </Link>
  );
}
