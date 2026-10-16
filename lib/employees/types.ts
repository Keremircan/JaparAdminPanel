import { formatDate } from "@/lib/date-utils";

export const DOCUMENT_CATEGORIES = ["sağlık raporu", "izin belgesi", "diğer"] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  "sağlık raporu": "Sağlık Raporu",
  "izin belgesi": "İzin Belgesi",
  diğer: "Diğer Belge",
};

/** `employees.drive_links` dizisinin bir elemanı. */
export interface EmployeeDocument {
  id: string;
  url: string;
  title?: string;
  category: DocumentCategory;
  /**
   * Eklenme anı (ISO, UTC). Eski { folder, health_report, ... } biçiminden
   * dönüştürülen belgelerde bilinmediği için null.
   */
  created_at: string | null;
}

export function isDocumentCategory(value: unknown): value is DocumentCategory {
  return (DOCUMENT_CATEGORIES as readonly unknown[]).includes(value);
}

/** Başlık girilmediyse kategori ve eklenme tarihinden üretilir: `İzin Belgesi - 16.10.2026` */
export function documentTitle(document: EmployeeDocument): string {
  if (document.title) return document.title;
  const label = DOCUMENT_CATEGORY_LABELS[document.category];
  return document.created_at ? `${label} - ${formatDate(document.created_at)}` : label;
}

// Eski tekil nesne biçimi (migration öncesi): anahtar → kategori ve başlık.
const LEGACY_DOCUMENTS: { key: string; category: DocumentCategory; title?: string }[] = [
  { key: "folder", category: "diğer", title: "Drive klasörü" },
  { key: "health_report", category: "sağlık raporu" },
  { key: "leave_permit", category: "izin belgesi" },
  { key: "other", category: "diğer" },
];

/**
 * `drive_links` değerini belge listesine çevirir. Yeni dizi biçimini ve
 * migration çalıştırılmadan önceki eski nesne biçimini okur; yalnızca geçerli
 * http(s) bağlantıları alınır.
 */
export function parseEmployeeDocuments(value: unknown): EmployeeDocument[] {
  if (Array.isArray(value)) {
    return value.flatMap((item): EmployeeDocument[] => {
      if (!item || typeof item !== "object") return [];
      const { id, url, title, category, created_at } = item as Record<string, unknown>;
      if (typeof id !== "string" || typeof url !== "string" || !isSafeUrl(url)) return [];
      if (!isDocumentCategory(category)) return [];
      return [
        {
          id,
          url,
          category,
          title: typeof title === "string" && title.trim() ? title.trim() : undefined,
          created_at: typeof created_at === "string" ? created_at : null,
        },
      ];
    });
  }

  if (value && typeof value === "object") {
    const legacy = value as Record<string, unknown>;
    return LEGACY_DOCUMENTS.flatMap(({ key, category, title }): EmployeeDocument[] => {
      const url = legacy[key];
      if (typeof url !== "string" || !isSafeUrl(url)) return [];
      // Kararlı kimlik: migration öncesinde de silinebilsin diye anahtardan türetilir.
      return [{ id: `legacy-${key}`, url, title, category, created_at: null }];
    });
  }

  return [];
}

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
  /** `drive_links` sütunundaki belgeler, eklenme sırasına göre. */
  documents: EmployeeDocument[];
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

export function employeePath(code: string): string {
  return `/employees/${encodeURIComponent(code)}`;
}
