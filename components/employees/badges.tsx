import { Smartphone, SmartphoneNfc } from "lucide-react";

import { formatDate } from "@/lib/date-utils";

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "border-ok/20 bg-ok/10 text-ok"
          : "border-line bg-sunken text-ink-soft"
      }`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${isActive ? "bg-ok" : "bg-ink-faint"}`}
      />
      {isActive ? "Aktif" : "Pasif"}
    </span>
  );
}

export function DeviceBadge({
  isBound,
  boundAt,
}: {
  isBound: boolean;
  boundAt: string | null;
}) {
  if (!isBound) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-ink-faint">
        <Smartphone aria-hidden className="size-4" />
        Bağlı değil
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink">
      <SmartphoneNfc aria-hidden className="size-4 text-accent" />
      Bağlı
      {boundAt && (
        <span className="text-ink-faint tabular-nums">{formatDate(boundAt)}</span>
      )}
    </span>
  );
}
