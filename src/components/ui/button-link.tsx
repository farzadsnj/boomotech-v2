import Link from "next/link";
import { ArrowIcon } from "./arrow-icon";
import { BookingActionLink } from "@/features/booking/booking-action-link";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
  className?: string;
  bookingService?: string;
};

export function ButtonLink({ href, children, variant = "primary", className = "", bookingService }: Props) {
  const styles = `button-link inline-flex items-center button-link--${variant} ${className}`.trim();
  const content = <><span>{children}</span><ArrowIcon /></>;
  return href === "/booking" ? (
    <BookingActionLink className={styles} href="/booking" servicePath={bookingService}>{content}</BookingActionLink>
  ) : (
    <Link className={styles} href={href}>
      <span>{children}</span>
      <ArrowIcon />
    </Link>
  );
}
