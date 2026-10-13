"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { formatTime } from "@/lib/date-utils";

const AUTO_REFRESH_MS = 60_000;

/** Sayfa verisini sunucudan yeniden çeker; sekme açıkken dakikada bir kendiliğinden de tazeler. */
export function RefreshButton({ fetchedAt }: { fetchedAt: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) startTransition(() => router.refresh());
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <div className="flex shrink-0 items-center gap-3">
      <p className="hidden text-sm text-ink-faint sm:block">
        Son güncelleme{" "}
        <time dateTime={fetchedAt} className="font-mono text-ink-soft tabular-nums">
          {formatTime(fetchedAt, { seconds: true })}
        </time>
      </p>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
        className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-all duration-200 ease-in-out hover:bg-sunken focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none active:scale-[0.98] disabled:cursor-progress disabled:opacity-70"
      >
        <RefreshCw
          aria-hidden
          className={`size-4 text-ink-soft ${isPending ? "animate-spin" : ""}`}
        />
        {isPending ? "Yenileniyor" : "Yenile"}
      </button>
    </div>
  );
}
