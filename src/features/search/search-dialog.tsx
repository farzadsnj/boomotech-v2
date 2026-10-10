"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchSite } from "./search-index";

function SearchIcon() {
  return <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>;
}

export function SearchDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchSite(query), [query]);

  function open() {
    dialogRef.current?.showModal();
    requestAnimationFrame(() => inputRef.current?.focus());
  }
  function close() {
    dialogRef.current?.close();
    setQuery("");
  }

  useEffect(() => {
    const openFromMobile = () => open();
    window.addEventListener("boomotech:open-search", openFromMobile);
    return () => window.removeEventListener("boomotech:open-search", openFromMobile);
  }, []);

  return <>
    <button aria-label="Search BoomoTech" className="header-control header-search" onClick={open} ref={triggerRef} type="button"><SearchIcon /><span>Search</span></button>
    <dialog aria-labelledby="site-search-title" className="search-dialog" onClose={() => triggerRef.current?.focus()} onCancel={(event) => { event.preventDefault(); close(); }} onKeyDownCapture={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }} ref={dialogRef}>
      <div className="search-dialog__surface">
        <header><div><p className="eyebrow">SITE SEARCH</p><h2 id="site-search-title">What can we help you find?</h2></div><button aria-label="Close search" className="search-dialog__close" onClick={close} type="button">×</button></header>
        <label className="search-dialog__input"><SearchIcon /><span className="sr-only">Search BoomoTech</span><input autoComplete="off" placeholder="Try “Wi-Fi”, “backup” or “Microsoft 365”" ref={inputRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={(event) => {
          if (!results.length) return;
          if (event.key === "ArrowDown") { event.preventDefault(); setActive((current) => (current + 1) % results.length); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActive((current) => (current - 1 + results.length) % results.length); }
          if (event.key === "Enter") { event.preventDefault(); window.location.assign(results[active].path); }
        }} /></label>
        <p aria-live="polite" className="search-dialog__status">{query.length >= 2 ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Enter at least two characters"}</p>
        {results.length ? <ul className="search-results">{results.map((result, index) => <li className={index === active ? "is-active" : ""} key={result.path}><Link href={result.path} onClick={close} onFocus={() => setActive(index)}><span>{result.category}</span><strong>{result.title}</strong><p>{result.description}</p></Link></li>)}</ul> : query.length >= 2 ? <div className="search-empty"><h3>Can’t find what you need?</h3><p>Describe the issue safely and BoomoTech can help identify a useful next step.</p><Link className="button-link button-link--primary" href="/support#request-support" onClick={close}>Ask for support</Link></div> : <div className="search-suggestions"><span>Popular starting points</span><Link href="/services/it-support" onClick={close}>IT support</Link><Link href="/services/network-wifi" onClick={close}>Wi-Fi and networks</Link><Link href="/tools/it-health-check" onClick={close}>IT Health Check</Link></div>}
      </div>
    </dialog>
  </>;
}
