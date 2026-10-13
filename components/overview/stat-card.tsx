import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone?: "neutral" | "ok";
  isLive?: boolean;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  isLive = false,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-line bg-surface/80 p-5 shadow-card backdrop-blur-md transition-all duration-200 ease-in-out hover:border-ink-faint/30">
      <div className="flex items-start justify-between gap-3">
        <h2 className="pt-1.5 text-sm leading-snug font-medium text-ink-soft">
          {label}
        </h2>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
            tone === "ok" ? "bg-ok/10 text-ok" : "bg-sunken text-ink-soft"
          }`}
        >
          <Icon aria-hidden className="size-4" strokeWidth={1.75} />
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p className="text-3xl font-semibold tracking-tight text-ink">
          {value.toLocaleString("tr-TR")}
        </p>
        {isLive && (
          <span className="flex items-center gap-1.5 rounded-md border border-ok/20 bg-ok/10 px-1.5 py-0.5 text-xs font-medium text-ok">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-ok" />
            </span>
            Canlı
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-faint">{hint}</p>
    </article>
  );
}
