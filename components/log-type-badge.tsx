import { LogIn, LogOut } from "lucide-react";

import type { LogType } from "@/lib/data/overview";

export function LogTypeBadge({ type }: { type: LogType }) {
  const isEntry = type === "IN";
  const Icon = isEntry ? LogIn : LogOut;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${
        isEntry
          ? "border-ok/20 bg-ok/10 text-ok"
          : "border-danger/20 bg-danger/10 text-danger"
      }`}
    >
      <Icon aria-hidden className="size-3.5" />
      {isEntry ? "Giriş" : "Çıkış"}
    </span>
  );
}
