"use client";

export default function ErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="state-page"><div className="container state-page__message"><p className="eyebrow"><span className="eyebrow-line" />PAGE ERROR</p><h1>This page could not be displayed.</h1><p>Please try loading the content again.</p><button className="button-link button-link--primary" onClick={reset} type="button">Try again</button></div></section>;
}
