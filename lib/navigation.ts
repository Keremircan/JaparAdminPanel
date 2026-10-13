import {
  Activity,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: "/" | "/employees" | "/attendance" | "/reports";
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/employees", label: "Çalışanlar", icon: Users },
  { href: "/attendance", label: "Canlı Hareketler", icon: Activity },
  { href: "/reports", label: "Raporlar & Puantaj", icon: FileSpreadsheet },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
}
