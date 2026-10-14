"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck, X } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { logout } from "@/lib/auth/actions";
import { NAV_ITEMS, isActivePath } from "@/lib/navigation";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Dinamik sayfalarda (ör. /employees/[code]) yol istek anında belli olur;
 * o ana kadar menü vurgusuz görünür.
 */
function ActiveNavItems({ onNavigate }: { onNavigate: () => void }) {
  return <NavItems pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavItems({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname !== null && isActivePath(pathname, href);

        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                isActive
                  ? "bg-sunken text-ink"
                  : "text-ink-soft hover:bg-sunken/60 hover:text-ink"
              }`}
            >
              <span
                aria-hidden
                className={`absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-transform duration-200 ease-in-out ${
                  isActive ? "scale-y-100" : "scale-y-0"
                }`}
              />
              <Icon
                aria-hidden
                strokeWidth={isActive ? 2 : 1.75}
                className={`size-[18px] shrink-0 transition-colors duration-200 ${
                  isActive
                    ? "text-accent"
                    : "text-ink-faint group-hover:text-ink-soft"
                }`}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm transition-opacity duration-200 ease-in-out lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-float" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap text-ink">
            Japar PDKS
          </span>
          <span className="rounded-md border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
            Yönetim
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-ink-faint transition-colors duration-200 hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none lg:hidden"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>

        <nav aria-label="Ana menü" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <Suspense fallback={<NavItems pathname={null} onNavigate={onClose} />}>
              <ActiveNavItems onNavigate={onClose} />
            </Suspense>
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-soft">
              <ShieldCheck aria-hidden className="size-[18px]" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-ink">Yönetici</p>
              <p className="truncate text-xs text-ink-faint">Tam yetkili oturum</p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-danger transition-all duration-200 ease-in-out hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
            >
              <LogOut aria-hidden className="size-[18px]" />
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
