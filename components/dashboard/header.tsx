"use client";

import { Suspense, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";

import { formatLongDate, formatTime } from "@/lib/date-utils";
import { findActiveItem } from "@/lib/navigation";

function subscribeToSeconds(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

function subscribeToConnection(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function IstanbulClock() {
  // Sunucuda null döner; saat yalnızca tarayıcıda, hydration sonrası belirir.
  const epochSeconds = useSyncExternalStore<number | null>(
    subscribeToSeconds,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
  const now = epochSeconds === null ? null : epochSeconds * 1000;

  return (
    <div
      title="Türkiye saati (Europe/Istanbul)"
      className="flex h-9 items-center gap-2.5 rounded-lg border border-line bg-surface/70 px-3 shadow-xs"
    >
      <time
        dateTime={now === null ? undefined : new Date(now).toISOString()}
        className="min-w-[8ch] font-mono text-sm font-medium text-ink tabular-nums"
      >
        {now === null ? "--:--:--" : formatTime(now, { seconds: true })}
      </time>
      <span aria-hidden className="hidden h-4 w-px bg-line md:block" />
      <span className="hidden text-sm text-ink-soft md:block">
        {now === null ? "" : formatLongDate(now)}
      </span>
    </div>
  );
}

function ConnectionStatus() {
  const isOnline = useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    () => true,
  );

  return (
    <div
      role="status"
      className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-200 ${
        isOnline
          ? "border-ok/20 bg-ok/10 text-ok"
          : "border-danger/20 bg-danger/10 text-danger"
      }`}
    >
      <span className="relative flex size-2">
        {isOnline && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
        )}
        <span
          className={`relative inline-flex size-2 rounded-full ${
            isOnline ? "bg-ok" : "bg-danger"
          }`}
        />
      </span>
      <span className="hidden sm:inline">
        {isOnline ? "Sistem Çevrimiçi" : "Bağlantı Yok"}
      </span>
    </div>
  );
}

function PageTitle() {
  return <>{findActiveItem(usePathname())?.label ?? "Yönetim Paneli"}</>;
}

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Menüyü aç"
        aria-controls="sidebar"
        className="-ml-1.5 flex size-9 items-center justify-center rounded-lg text-ink-soft transition-colors duration-200 hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <nav aria-label="Konum" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          <li className="hidden text-ink-faint sm:block">Japar PDKS</li>
          <li aria-hidden className="hidden text-ink-faint sm:block">
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="truncate font-medium text-ink">
            <Suspense fallback={<span className="text-ink-faint">Yönetim Paneli</span>}>
              <PageTitle />
            </Suspense>
          </li>
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <IstanbulClock />
        <ConnectionStatus />
      </div>
    </header>
  );
}
