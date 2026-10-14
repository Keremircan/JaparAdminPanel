export const DRIVE_LINK_KINDS = [
  "folder",
  "health_report",
  "leave_permit",
  "other",
] as const;

export type DriveLinkKind = (typeof DRIVE_LINK_KINDS)[number];

export type DriveLinks = Partial<Record<DriveLinkKind, string>>;

export const DRIVE_LINK_LABELS: Record<DriveLinkKind, string> = {
  folder: "Drive klasörü",
  health_report: "Sağlık raporu",
  leave_permit: "İzin belgesi",
  other: "Diğer belge",
};

/** `employees` satırı; parola özeti ve cihaz anahtarı tarayıcıya gönderilmez. */
export type Employee = {
  id: number;
  employee_code: string;
  full_name: string;
  is_active: boolean;
  department: string | null;
  job: string | null;
  shift: string | null;
  shift_type: string | null;
  hire_date: string | null;
  device_bound_at: string | null;
  device_label: string | null;
  /** `device_public_key` dolu mu; anahtarın kendisi sunucuda kalır. */
  is_device_bound: boolean;
  drive_links: DriveLinks;
};

export type EmployeeStatusFilter = "all" | "active" | "inactive";

export type EmployeeFilters = {
  query: string;
  department: string;
  status: EmployeeStatusFilter;
};

export function isSafeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Veritabanındaki jsonb değerinden yalnızca geçerli http(s) bağlantılarını alır. */
export function parseDriveLinks(value: unknown): DriveLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const links: DriveLinks = {};
  for (const kind of DRIVE_LINK_KINDS) {
    const link = (value as Record<string, unknown>)[kind];
    if (typeof link === "string" && isSafeUrl(link)) links[kind] = link;
  }
  return links;
}

export function employeePath(code: string): string {
  return `/employees/${encodeURIComponent(code)}`;
}
