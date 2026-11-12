import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <section className="preview-page"><div className="container preview-page__inner">
      <p className="eyebrow"><span className="eyebrow-line" />PAGE NOT FOUND</p>
      <h1>That page is not here.</h1>
      <p className="preview-page__lead">The link may have changed, or the page may still be in preparation.</p>
      <ButtonLink href="/">Back to homepage</ButtonLink>
    </div></section>
  );
}
