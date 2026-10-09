"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { serviceByPath } from "@/content/services";
import { BookingForm } from "@/features/booking/booking-form";
import type { ChatHistoryItem } from "./chat-schema";
import { serviceGuidance, type ServiceMatch } from "./service-matcher";

const SESSION_KEY = "boomotech-welcome-seen";
const SOUND_KEY = "boomotech-chat-sound";
const SOUND_SESSION_KEY = "boomotech-chat-sound-played";
type View = "home" | "categories" | "category" | "question" | "booking";
const categories = [
  { id: "fix", label: "Fix an IT problem", paths: ["/services/it-support", "/services/microsoft-365", "/services/managed-it"] },
  { id: "systems", label: "Improve Wi-Fi or business systems", paths: ["/services/network-wifi", "/services/microsoft-365", "/services/managed-it"] },
  { id: "security", label: "Security and backups", paths: ["/services/cybersecurity", "/services/backup-recovery"] },
  { id: "digital", label: "Website, design or digital presence", paths: ["/services/web-software", "/services/ui-ux-branding", "/services/digital-presence"] },
  { id: "future", label: "Cloud, AI or automation", paths: ["/services/cloud-infrastructure", "/services/ai-automation"] },
] as const;

export function Chatbot({ aiEnabled = false }: { aiEnabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [attention, setAttention] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [view, setView] = useState<View>("home");
  const [categoryId, setCategoryId] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ message: string; matches: ServiceMatch[] } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [chatError, setChatError] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const viewHeading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const preferenceTimer = window.setTimeout(() => setSoundEnabled(localStorage.getItem(SOUND_KEY) === "on"), 0);
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = window.setTimeout(() => { setWelcome(true); setAttention(true); sessionStorage.setItem(SESSION_KEY, "true"); }, 2800);
    return () => { window.clearTimeout(preferenceTimer); window.clearTimeout(timer); };
  }, []);
  useEffect(() => {
    const booking = (event: Event) => {
      const detail = (event as CustomEvent<{ servicePath?: string; trigger?: HTMLElement }>).detail;
      opener.current = detail?.trigger ?? document.activeElement as HTMLElement;
      setSelectedService(detail?.servicePath ?? ""); setView("booking"); setWelcome(false); setAttention(false); setOpen(true);
    };
    window.addEventListener("boomotech:open-booking", booking);
    return () => window.removeEventListener("boomotech:open-booking", booking);
  }, []);
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => title.current?.focus());
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 600px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);
  useEffect(() => {
    if (!open || view === "home" || view === "booking") return;
    requestAnimationFrame(() => viewHeading.current?.focus());
  }, [open, view, categoryId]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => (opener.current ?? launcher.current)?.focus());
  }
  function playChime(force = false) {
    if ((!soundEnabled && !force) || document.hidden || navigator.webdriver || sessionStorage.getItem(SOUND_SESSION_KEY)) return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + .12);
      gain.gain.setValueAtTime(.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + .18);
      oscillator.addEventListener("ended", () => void context.close());
      sessionStorage.setItem(SOUND_SESSION_KEY, "true");
    } catch { /* Audio is an optional enhancement. */ }
  }
  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    if (next) playChime(true);
  }
  function book(path = "") { setSelectedService(path); setView("booking"); }
  function chooseCategory(id: string) { setCategoryId(id); setView("category"); }
  async function ask(event: FormEvent) {
    event.preventDefault();
    const message = question.trim();
    if (!message || chatPending) return;
    setChatPending(true);
    setChatError("");
    const guidance = serviceGuidance(message);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: chatHistory.slice(-8) }),
      });
      const payload = await response.json() as { message?: string; error?: string };
      if (!response.ok || !payload.message) throw new Error(payload.error ?? "Chat request failed.");
      const nextHistory = [
        ...chatHistory,
        { role: "user" as const, content: message },
        { role: "assistant" as const, content: payload.message },
      ].slice(-8) satisfies ChatHistoryItem[];
      setChatHistory(nextHistory);
      setAnswer({ message: payload.message, matches: guidance.matches });
      setQuestion("");
      playChime();
    } catch {
      setChatError("The assistant is temporarily unavailable. Your message was not stored. Please try again, browse the service categories or request a consultation.");
    } finally {
      setChatPending(false);
    }
  }
  const category = categories.find((item) => item.id === categoryId);
  const categoryServices = category?.paths.map((path) => serviceByPath.get(path)).filter(Boolean) ?? [];

  return <aside className={`chatbot${open ? " is-open" : ""}`} aria-label="BoomoTech service assistant">
    {welcome && !open && <div className="chat-welcome"><p role="status">Need help choosing a service? Tell us what you’re trying to fix or improve.</p><button aria-label="Dismiss welcome message" onClick={() => { setWelcome(false); setAttention(false); }}>×</button></div>}
    {open && <div className="chat-panel" ref={panel} role="dialog" aria-modal="false" aria-labelledby="chat-title">
      <header><div><p>BoomoTech</p><h2 id="chat-title" ref={title} tabIndex={-1}>Service assistant</h2></div><div className="chat-header-actions"><button aria-label={`Turn notification sound ${soundEnabled ? "off" : "on"}`} aria-pressed={soundEnabled} className="chat-sound" onClick={toggleSound} type="button">{soundEnabled ? "Sound on" : "Sound off"}</button><button className="chat-close" onClick={close} aria-label="Close service assistant">×</button></div></header>
      <div className="chat-body">
        {view !== "home" && <button className="chat-back" onClick={() => setView(view === "category" ? "categories" : "home")}>← {view === "category" ? "Service needs" : "Main menu"}</button>}
        {view === "home" && <><p>Choose a starting point. Suggestions use BoomoTech’s published service information.</p><div className="chat-actions"><button onClick={() => setView("categories")}>Explore our services</button><button className="primary" onClick={() => book()}>Book a consultation</button>{aiEnabled ? <button onClick={() => setView("question")}>Ask a service question</button> : null}</div><Link className="chat-direct-link" href="/booking" onClick={close}>Open the full booking page</Link></>}
        {view === "categories" && <section aria-labelledby="chat-categories-title"><h3 id="chat-categories-title" ref={viewHeading} tabIndex={-1}>What would you like to do?</h3><div className="chat-actions">{categories.map((item) => <button key={item.id} onClick={() => chooseCategory(item.id)}>{item.label}</button>)}{aiEnabled ? <button onClick={() => setView("question")}>Not sure — help me choose</button> : null}</div></section>}
        {view === "category" && category && <section aria-labelledby="chat-category-title"><h3 id="chat-category-title" ref={viewHeading} tabIndex={-1}>{category.label}</h3><div className="chat-service-list">{categoryServices.map((service) => service && <article key={service.path}><h4>{service.name}</h4><p>{service.description}</p><div><Link href={service.path} onClick={close}>View service</Link><button onClick={() => book(service.path)}>Request consultation</button></div></article>)}</div></section>}
        {view === "question" && <section aria-labelledby="chat-question-title"><h3 id="chat-question-title" ref={viewHeading} tabIndex={-1}>Describe what you need</h3><p>Ask about BoomoTech services and the assistant will use the published service and FAQ information.</p><p className="fine-print">Your question and limited recent chat context are sent to an AI service to generate the answer. Do not include passwords, confidential customer data or other sensitive information. Read the <Link href="/privacy">Privacy Policy</Link>.</p><form className="chat-question" onSubmit={ask}><label htmlFor="service-question">What is happening?</label><textarea id="service-question" rows={4} maxLength={1500} required value={question} onChange={(event) => { setQuestion(event.target.value); if (chatError) setChatError(""); }} placeholder="For example: computers and Wi-Fi for our office" /><button className="button-link button-link--primary" disabled={chatPending}>{chatPending ? "Finding a helpful answer…" : "Ask BoomoTech"}</button></form><div className="sr-only" aria-live="polite" aria-atomic="true">{chatPending ? "Finding a helpful answer." : chatError || answer?.message || ""}</div>{chatError && <p className="chat-error" role="alert">{chatError}</p>}{answer && <div className="chat-answer"><p>{answer.message}</p>{answer.matches.length ? answer.matches.map(({ service }) => <article key={service.path}><h4>{service.name}</h4><p><strong>Why this may help:</strong> {service.description}</p><Link href={service.path} onClick={close}>View {service.name}</Link></article>) : <button onClick={() => setView("categories")}>Browse all service categories</button>}<button onClick={() => book(answer.matches[0]?.service.path)}>Request a consultation</button></div>}</section>}
        {view === "booking" && <BookingForm key={selectedService} initialService={selectedService} compact onClose={close} />}
      </div>
    </div>}
    <button ref={launcher} className={`chat-launcher${attention ? " needs-attention" : ""}`} aria-label={open ? "Close BoomoTech chat" : "Chat with BoomoTech"} aria-expanded={open} onClick={() => { setWelcome(false); setAttention(false); if (open) close(); else { opener.current = launcher.current; setOpen(true); playChime(); } }}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4V4Zm4 5h8M8 12h5" /></svg><span>Chat with BoomoTech</span></button>
  </aside>;
}
