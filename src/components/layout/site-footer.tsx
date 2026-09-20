import Link from "next/link";
import { site } from "@/content/site";
import { ArrowIcon } from "@/components/ui/arrow-icon";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__intro">
            <Link className="footer-brand" href="/">Boomo<span>Tech</span><span className="footer-brand__dot">.</span></Link>
            <p>Practical technology help for the problems in front of you and the opportunities ahead.</p>
            <Link className="footer-contact" href="/contact">Get in touch <ArrowIcon diagonal /></Link>
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
          <p>© {new Date().getFullYear()} BoomoTech. Website foundation in progress.</p>
          <p>Brisbane, Queensland · Remote options across Australia</p>
        </div>
      </div>
    </footer>
  );
}
