type Props = { children: React.ReactNode; className?: string; delay?: 0 | 1 | 2 | 3 };

export function Reveal({ children, className = "", delay = 0 }: Props) {
  return <div className={`reveal reveal--delay-${delay} ${className}`.trim()} suppressHydrationWarning>{children}</div>;
}
