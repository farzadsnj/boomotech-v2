"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { services } from "@/content/services";
import { BookingForm } from "@/features/booking/booking-form";
import { serviceGuidance, type ServiceMatch } from "./service-matcher";

const SESSION_KEY = "boomotech-welcome-seen";
type View = "home" | "services" | "question" | "booking";

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [view, setView] = useState<View>("home");
  const [selectedService, setSelectedService] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ message: string; matches: ServiceMatch[] } | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = window.setTimeout(() => { setWelcome(true); sessionStorage.setItem(SESSION_KEY, "true"); }, 2400);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const booking = (event: Event) => { const detail = (event as CustomEvent<{ servicePath?: string }>).detail; setSelectedService(detail?.servicePath ?? ""); setView("booking"); setWelcome(false); setOpen(true); };
    window.addEventListener("boomotech:open-booking", booking);
    return () => window.removeEventListener("boomotech:open-booking", booking);
  }, []);
  useEffect(() => {
    if (!open) return;
    dialog.current?.querySelector<HTMLElement>("button, a, input")?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); launcher.current?.focus(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);

  const close = () => { setOpen(false); launcher.current?.focus(); };
  const book = (path = "") => { setSelectedService(path); setView("booking"); };
  const ask = (event: FormEvent) => { event.preventDefault(); setAnswer(serviceGuidance(question)); };

  return <aside className="chatbot" aria-label="BoomoTech service assistant">
    {welcome && !open && <div className="chat-welcome" role="status"><button aria-label="Dismiss welcome message" onClick={() => setWelcome(false)}>×</button><p>Hi! How can we help with your technology today?</p></div>}
    {open && <div className="chat-panel" ref={dialog} role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <header><div><p>BoomoTech</p><h2 id="chat-title">Service assistant</h2></div><button className="chat-close" onClick={close} aria-label="Close service assistant">×</button></header>
      <div className="chat-body">
        {view !== "home" && <button className="chat-back" onClick={() => setView("home")}>← Main menu</button>}
        {view === "home" && <><p>Choose a starting point. This assistant uses BoomoTech’s approved website content.</p><div className="chat-actions"><button onClick={() => setView("services")}>Explore our services</button><button className="primary" onClick={() => book()}>Book a consultation</button><button onClick={() => setView("question")}>Ask a service question</button></div><Link className="chat-direct-link" href="/booking" onClick={close}>Open the full booking page</Link></>}
        {view === "services" && <div className="chat-service-list">{services.map((service) => <article key={service.path}><h3>{service.name}</h3><p>{service.description}</p><div><Link href={service.path} onClick={close}>View service</Link><button onClick={() => book(service.path)}>Request consultation</button></div></article>)}</div>}
        {view === "question" && <><form className="chat-question" onSubmit={ask}><label htmlFor="service-question">What do you need help with?</label><textarea id="service-question" rows={4} maxLength={500} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="For example: computers and Wi-Fi for our office" /><button className="button-link button-link--primary" disabled={!question.trim()}>Find a service</button></form>{answer && <div className="chat-answer" aria-live="polite"><p>{answer.message}</p>{answer.matches.map(({ service }) => <Link key={service.path} href={service.path} onClick={close}>View {service.name}</Link>)}<button onClick={() => book(answer.matches[0]?.service.path)}>Request a consultation</button></div>}</>}
        {view === "booking" && <BookingForm key={selectedService} initialService={selectedService} compact />}
      </div>
    </div>}
    <button ref={launcher} className="chat-launcher" aria-label={open ? "Close BoomoTech chat" : "Chat with BoomoTech"} aria-expanded={open} onClick={() => { setWelcome(false); setOpen((value) => !value); }}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4V4Zm4 5h8M8 12h5" /></svg><span>Chat with BoomoTech</span></button>
  </aside>;
}
