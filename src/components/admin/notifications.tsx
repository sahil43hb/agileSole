"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Volume2, VolumeX } from "lucide-react";

export const ADMIN_LIVE_EVENT = "as-admin-live";

export type AdminNotice = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  severity: "info" | "urgent";
  createdAt: string;
  read: boolean;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(diff / 60000));
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

function unreadBadge(count: number) {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    /* ignore */
  }
}

export function AdminNotifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotice[]>([]);
  const [unread, setUnread] = useState(0);
  const [live, setLive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    setMuted(localStorage.getItem("as_admin_mute") === "1");
    setDesktop(typeof Notification !== "undefined" && Notification.permission === "granted");
  }, []);

  const ingest = useCallback(
    (next: AdminNotice[], opts?: { chime?: boolean }) => {
      setItems((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        for (const item of next) map.set(item.id, item);
        return [...map.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 40);
      });
      for (const item of next) {
        if (seen.current.has(item.id)) continue;
        seen.current.add(item.id);
        window.dispatchEvent(new CustomEvent(ADMIN_LIVE_EVENT, { detail: item }));
        if (opts?.chime && !item.read) {
          if (!muted) playChime();
          if (desktop && typeof Notification !== "undefined") {
            try {
              new Notification(item.title, { body: item.body, tag: item.id });
            } catch {
              /* ignore */
            }
          }
        }
      }
    },
    [desktop, muted],
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/admin/notifications", { credentials: "same-origin" });
    const json = await res.json();
    if (!json.ok) return;
    const list = (json.data.items || []) as AdminNotice[];
    setUnread(Number(json.data.unread || 0));
    for (const item of list) seen.current.add(item.id);
    setItems(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let source: EventSource | null = null;
    let retry: number | undefined;

    function connect() {
      source?.close();
      source = new EventSource("/api/v1/admin/notifications/stream");
      source.addEventListener("hello", () => setLive(true));
      source.addEventListener("notification", (ev) => {
        try {
          const item = JSON.parse((ev as MessageEvent).data) as AdminNotice;
          ingest([item], { chime: true });
          setUnread((n) => n + (item.read ? 0 : 1));
        } catch {
          /* ignore */
        }
      });
      source.onerror = () => {
        setLive(false);
        source?.close();
        retry = window.setTimeout(connect, 4000);
      };
    }

    connect();
    const poll = window.setInterval(() => {
      void fetch("/api/v1/admin/notifications", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((json) => {
          if (!json.ok) return;
          const list = (json.data.items || []) as AdminNotice[];
          setUnread(Number(json.data.unread || 0));
          const fresh = list.filter((item) => !seen.current.has(item.id));
          if (fresh.length) ingest(fresh, { chime: true });
          else setItems(list);
        })
        .catch(() => {});
    }, 15000);

    return () => {
      source?.close();
      if (poll) window.clearInterval(poll);
      if (retry) window.clearTimeout(retry);
    };
  }, [ingest]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function mark(ids?: string[], all = false) {
    const res = await fetch("/api/v1/admin/notifications", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, all }),
    });
    const json = await res.json();
    if (!json.ok) return;
    setItems(json.data.items);
    setUnread(json.data.unread);
  }

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem("as_admin_mute", next ? "1" : "0");
      return next;
    });
  }

  async function enableDesktop() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setDesktop(perm === "granted");
  }

  const badge = unreadBadge(unread);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#f4f7f5] text-ink transition hover:bg-brand-mist"
        aria-label={badge ? `Notifications, ${badge} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {badge ? (
          <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-x-3 top-[calc(4.75rem+8px)] z-50 flex max-h-[min(32rem,calc(100dvh-6.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--admin-line)] bg-white shadow-xl md:absolute md:inset-x-auto md:end-0 md:top-[calc(100%+10px)] md:w-[min(24rem,calc(100vw-2rem))]">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--admin-line)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Inbox</p>
              <p className="text-[11px] text-ink-faint">{live ? "Live" : "Reconnecting…"} · {unread} unread</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full p-2 text-ink-muted hover:bg-[#f4f7f5]"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              {unread ? (
                <button type="button" className="rounded-full px-2.5 py-1 text-xs font-medium text-brand-dark hover:bg-brand-mist" onClick={() => void mark(undefined, true)}>
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>
          {!desktop ? (
            <button type="button" onClick={() => void enableDesktop()} className="w-full border-b border-[var(--admin-line)] px-4 py-2 text-start text-xs text-ink-muted hover:bg-[#f4f7f5]">
              Turn on desktop alerts for new COD orders
            </button>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.length ? (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    void mark([item.id]);
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className={`flex w-full flex-col gap-0.5 border-b border-[var(--admin-line)] px-4 py-3 text-start last:border-0 hover:bg-[#f4f7f5] ${
                    item.read ? "" : "bg-brand-mist/50"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="shrink-0 text-[11px] text-ink-faint">{timeAgo(item.createdAt)}</span>
                  </span>
                  {item.body ? <span className="line-clamp-2 text-xs text-ink-muted">{item.body}</span> : null}
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">No alerts yet. New COD orders land here instantly.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
