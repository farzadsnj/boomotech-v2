"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const SESSION_KEY = "boomotech-welcome-seen";
const ChatbotPanel = dynamic(
  () => import("./chatbot-panel").then((module) => module.ChatbotPanel),
  {
    ssr: false,
    loading: () => <div className="chat-panel chat-panel--loading" role="status">Loading service assistant…</div>,
  },
);

type OpenRequest = { key: number; view: "home" | "booking"; servicePath: string };

export function Chatbot({ aiEnabled = false }: { aiEnabled?: boolean }) {
  const [openRequest, setOpenRequest] = useState<OpenRequest | null>(null);
  const [welcome, setWelcome] = useState(false);
  const [attention, setAttention] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpenRequest(null);
    requestAnimationFrame(() => (opener.current ?? launcher.current)?.focus());
  }, []);

  const open = useCallback((view: OpenRequest["view"], servicePath = "", trigger?: HTMLElement | null) => {
    opener.current = trigger ?? document.activeElement as HTMLElement | null;
    setWelcome(false);
    setAttention(false);
    setOpenRequest((current) => ({ key: (current?.key ?? 0) + 1, view, servicePath }));
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = window.setTimeout(() => {
      setWelcome(true);
      setAttention(true);
      sessionStorage.setItem(SESSION_KEY, "true");
    }, 2800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const booking = (event: Event) => {
      const detail = (event as CustomEvent<{ servicePath?: string; trigger?: HTMLElement }>).detail;
      open("booking", detail?.servicePath ?? "", detail?.trigger);
    };
    window.addEventListener("boomotech:open-booking", booking);
    return () => window.removeEventListener("boomotech:open-booking", booking);
  }, [open]);

  const isOpen = Boolean(openRequest);
  useLayoutEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 600px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  return <aside className={`chatbot${isOpen ? " is-open" : ""}`} aria-label="BoomoTech service assistant">
    {welcome && !isOpen ? <div className="chat-welcome"><p role="status">Need help choosing a service? Tell us what you’re trying to fix or improve.</p><button aria-label="Dismiss welcome message" onClick={() => { setWelcome(false); setAttention(false); }} type="button">×</button></div> : null}
    {openRequest ? <ChatbotPanel aiEnabled={aiEnabled} initialService={openRequest.servicePath} initialView={openRequest.view} key={openRequest.key} onClose={close} /> : null}
    <button ref={launcher} className={`chat-launcher${attention ? " needs-attention" : ""}`} aria-label={isOpen ? "Close BoomoTech chat" : "Chat with BoomoTech"} aria-expanded={isOpen} onClick={() => { if (isOpen) close(); else open("home", "", launcher.current); }} type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4V4Zm4 5h8M8 12h5" /></svg><span>Chat with BoomoTech</span></button>
  </aside>;
}
