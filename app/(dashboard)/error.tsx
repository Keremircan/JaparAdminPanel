"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-line bg-surface/80 px-6 py-16 text-center shadow-card backdrop-blur-md"
    >
      <span className="flex size-11 items-center justify-center rounded-xl border border-danger/20 bg-danger/10 text-danger">
        <TriangleAlert aria-hidden className="size-5" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 text-base font-medium text-ink">Veriler yüklenemedi</h2>
      <p className="mt-1.5 max-w-[48ch] text-sm leading-relaxed text-ink-soft">
        Veritabanına ulaşılamadı. Bağlantınızı ve Supabase ortam değişkenlerini
        kontrol edip tekrar deneyin.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-xs transition-all duration-200 ease-in-out hover:bg-sunken focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
      >
        <RotateCw aria-hidden className="size-4 text-ink-soft" />
        Tekrar dene
      </button>
    </section>
  );
}
