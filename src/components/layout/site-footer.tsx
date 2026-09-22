import Link from "next/link";
import { site } from "@/content/site";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { BrandLogo } from "@/components/brand/brand-logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__intro">
            <BrandLogo footer />
            <p>Practical technology help for the problems in front of you and the opportunities ahead.</p>
            <Link className="footer-contact" href="/contact">Prepare to get in touch <ArrowIcon diagonal /></Link>
          </div>
          <div className="site-footer__columns">
            {site.footer.map((group) => (
              <div key={group.title}>
                <h2>{group.title}</h2>
                <ul>{group.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
              </div>
            ))}
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} BoomoTech. Content pending owner approval.</p>
          <p>Brisbane, Queensland · Remote options across Australia</p>
        </div>
      </div>
    </footer>
  );
}
