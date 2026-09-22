import Link from "next/link";
import { ArrowIcon } from "@/components/ui/arrow-icon";

export function Breadcrumbs({ path, title }: { path: string; title: string }) {
  const parts = path.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <Link href="/">Home</Link>
      {parts.map((part, index) => {
        const href = `/${parts.slice(0, index + 1).join("/")}`;
        const last = index === parts.length - 1;
        const label = last ? title : part.replaceAll("-", " ");
        return <span className="breadcrumbs__part" key={href}><ArrowIcon />{last ? <span aria-current="page">{label}</span> : <Link href={href}>{label}</Link>}</span>;
      })}
    </nav>
  );
}
