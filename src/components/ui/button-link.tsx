import Link from "next/link";
import { ArrowIcon } from "./arrow-icon";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
  className?: string;
  bookingService?: string;
  bookingIntent?: "support" | "project" | "consultation" | "quote";
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function ButtonLink({ href, children, variant = "primary", className = "", bookingService, bookingIntent = "consultation", onClick }: Props) {
  const styles = `button-link inline-flex items-center button-link--${variant} ${className}`.trim();
  const content = <><span>{children}</span><ArrowIcon /></>;
  const destination = href === "/booking" && (bookingService || bookingIntent !== "consultation")
    ? `/booking?${new URLSearchParams({ ...(bookingService ? { service: bookingService } : {}), intent: bookingIntent }).toString()}`
    : href;
  return <Link className={styles} href={destination} onClick={onClick}>{content}</Link>;
}
