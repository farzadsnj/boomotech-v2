"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardIcon } from "@/features/dashboard/components/dashboard-icon";

type NotificationRecord = {
  id: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  readAt: string | null;
};

type NotificationResponse = {
  records: NotificationRecord[];
  unreadCount: number;
  total: number;
  page: number;
  totalPages: number;
};

const dateTime = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Brisbane" });

async function loadNotifications(page = 1, limit = 6, signal?: AbortSignal) {
  const response = await fetch(`/api/notifications?page=${page}&limit=${limit}`, { cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok) throw new Error("notification-load-failed");
  return response.json() as Promise<NotificationResponse>;
}

async function updateNotifications(input: { action: "read"; id: string } | { action: "read-all" }) {
  const response = await fetch("/api/notifications", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error("notification-update-failed");
  window.dispatchEvent(new Event("boomotech:notifications-changed"));
}

function NotificationItems({ notifications, onOpen, onRead }: { notifications: NotificationRecord[]; onOpen: (notification: NotificationRecord) => void; onRead: (id: string) => void }) {
  return <ul className="notification-list">{notifications.map((notification) => <li className={notification.readAt ? "" : "is-unread"} key={notification.id}>
    <Link href={notification.href} onClick={(event) => { event.preventDefault(); onOpen(notification); }}>
      <span className="notification-list__marker" aria-hidden="true" />
      <span><strong>{notification.title}</strong><small>{notification.description}</small><time dateTime={notification.createdAt}>{dateTime.format(new Date(notification.createdAt))}</time></span>
    </Link>
    {!notification.readAt ? <button aria-label={`Mark ${notification.title} as read`} onClick={() => onRead(notification.id)} type="button">Mark read</button> : null}
  </li>)}</ul>;
}

export function NotificationCentre() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try { const next = await loadNotifications(1, 6, signal); setError(false); setData(next); }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === "AbortError")) setError(true); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadNotifications(1, 6, controller.signal).then((next) => { setError(false); setData(next); }).catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === "AbortError")) setError(true); });
    const changed = () => void refresh();
    window.addEventListener("boomotech:notifications-changed", changed);
    return () => { controller.abort(); window.removeEventListener("boomotech:notifications-changed", changed); };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  async function markRead(id: string) {
    if (busy) return;
    setBusy(true);
    try { await updateNotifications({ action: "read", id }); await refresh(); }
    catch { setError(true); }
    finally { setBusy(false); }
  }

  async function openNotification(notification: NotificationRecord) {
    if (!notification.readAt) {
      try { await updateNotifications({ action: "read", id: notification.id }); }
      catch { /* Navigation remains available when read-state persistence fails. */ }
    }
    setOpen(false);
    router.push(notification.href);
  }

  async function markAllRead() {
    if (busy) return;
    setBusy(true);
    try { await updateNotifications({ action: "read-all" }); await refresh(); }
    catch { setError(true); }
    finally { setBusy(false); }
  }

  const unread = data?.unreadCount ?? 0;
  return <div className="notification-centre" ref={root}>
    <button aria-controls="dashboard-notification-panel" aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="notification-centre__trigger" onClick={() => setOpen((value) => !value)} ref={button} type="button"><DashboardIcon name="notifications" />{unread ? <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span> : null}</button>
    {open ? <section aria-label="Recent notifications" className="notification-centre__panel" id="dashboard-notification-panel">
      <header><div><h2>Notifications</h2><p>{unread ? `${unread} unread` : "You are up to date"}</p></div>{unread ? <button disabled={busy} onClick={markAllRead} type="button">Mark all read</button> : null}</header>
      {!data && !error ? <div className="notification-state" role="status"><span className="notification-state__spinner" /><p>Loading notifications…</p></div> : null}
      {error ? <div className="notification-state" role="alert"><p>Notifications could not be loaded.</p><button onClick={() => void refresh()} type="button">Try again</button></div> : null}
      {data && !data.records.length ? <div className="notification-state"><span aria-hidden="true">✓</span><p>No notifications yet.</p></div> : null}
      {data?.records.length ? <NotificationItems notifications={data.records} onOpen={(notification) => void openNotification(notification)} onRead={(id) => void markRead(id)} /> : null}
      <footer><Link href="/notifications" onClick={() => setOpen(false)}>View all notifications</Link></footer>
    </section> : null}
  </div>;
}

export function NotificationPageList({ initialPage }: { initialPage: number }) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try { const next = await loadNotifications(page, 20); setError(false); setData(next); }
    catch { setError(true); }
  }, [page]);
  useEffect(() => {
    let active = true;
    void loadNotifications(page, 20).then((next) => { if (active) { setError(false); setData(next); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [page]);

  async function markRead(id: string) { setBusy(true); try { await updateNotifications({ action: "read", id }); await refresh(); } catch { setError(true); } finally { setBusy(false); } }
  async function markAllRead() { setBusy(true); try { await updateNotifications({ action: "read-all" }); await refresh(); } catch { setError(true); } finally { setBusy(false); } }
  async function openNotification(notification: NotificationRecord) { if (!notification.readAt) { try { await updateNotifications({ action: "read", id: notification.id }); } catch { /* Keep destination available. */ } } router.push(notification.href); }
  function changePage(next: number) { setData(null); setPage(next); window.history.replaceState(null, "", `/notifications?page=${next}`); }

  return <section aria-labelledby="all-notifications-title" className="notifications-page__panel">
    <header><div><h1 id="all-notifications-title">Notifications</h1><p>Request updates for your protected BoomoTech workspace.</p></div>{data?.unreadCount ? <button disabled={busy} onClick={markAllRead} type="button">Mark all as read</button> : null}</header>
    {!data && !error ? <div className="notification-page-state" role="status"><span className="notification-state__spinner" /><p>Loading notifications…</p></div> : null}
    {error ? <div className="notification-page-state" role="alert"><h2>Notifications unavailable</h2><p>Try loading this protected view again.</p><button onClick={() => void refresh()} type="button">Try again</button></div> : null}
    {data && !data.records.length ? <div className="notification-page-state"><span aria-hidden="true">✓</span><h2>No notifications yet</h2><p>New request activity will appear here.</p></div> : null}
    {data?.records.length ? <NotificationItems notifications={data.records} onOpen={(notification) => void openNotification(notification)} onRead={(id) => void markRead(id)} /> : null}
    {data && data.totalPages > 1 ? <nav aria-label="Notification pages" className="admin-pagination"><button disabled={page <= 1} onClick={() => changePage(page - 1)} type="button">← Previous</button><span>Page {page} of {data.totalPages}</span><button disabled={page >= data.totalPages} onClick={() => changePage(page + 1)} type="button">Next →</button></nav> : null}
  </section>;
}
