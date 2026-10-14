import { DRIVE_LINK_KINDS, isSafeUrl, type DriveLinks } from "./types";

export type EmployeeFormMode = "create" | "edit";

export type EmployeeFormValues = {
  full_name: string;
  employee_code: string;
  department: string;
  job: string;
  shift_type: string;
  shift: string;
  hire_date: string;
  is_active: boolean;
  drive_links: Record<keyof DriveLinks, string>;
};

export type EmployeeFormField =
  | Exclude<keyof EmployeeFormValues, "drive_links" | "is_active">
  | "password"
  | `drive_links.${keyof DriveLinks}`;

export type EmployeeFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<EmployeeFormField, string>>;
  /** Başarılı kayıttan sonra yönlendirilecek sicil numarası. */
  employeeCode?: string;
};

export const PASSWORD_MIN_LENGTH = 6;
// bcrypt 72 bayttan sonrasını yok sayar.
const PASSWORD_MAX_BYTES = 72;
const URL_MAX_LENGTH = 2000;
const EMPLOYEE_CODE_PATTERN = /^[A-Za-z0-9._-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MAX_LENGTHS = {
  full_name: 100,
  employee_code: 50,
  department: 100,
  job: 100,
  shift: 50,
  shift_type: 50,
} as const;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export type ParsedEmployeeForm =
  | { ok: true; values: EmployeeFormValues; password: string | null }
  | { ok: false; values: EmployeeFormValues; fieldErrors: EmployeeFormState["fieldErrors"] };

export function parseEmployeeForm(
  formData: FormData,
  mode: EmployeeFormMode,
): ParsedEmployeeForm {
  const values: EmployeeFormValues = {
    full_name: text(formData, "full_name"),
    employee_code: text(formData, "employee_code"),
    department: text(formData, "department"),
    job: text(formData, "job"),
    shift_type: text(formData, "shift_type"),
    shift: text(formData, "shift"),
    hire_date: text(formData, "hire_date"),
    is_active: formData.get("is_active") === "on",
    drive_links: {
      folder: text(formData, "drive_links.folder"),
      health_report: text(formData, "drive_links.health_report"),
      leave_permit: text(formData, "drive_links.leave_permit"),
      other: text(formData, "drive_links.other"),
    },
  };
  const rawPassword = formData.get("password");
  const password = typeof rawPassword === "string" ? rawPassword : "";

  const errors: NonNullable<EmployeeFormState["fieldErrors"]> = {};

  if (!values.full_name) errors.full_name = "Ad soyad girin.";

  if (mode === "create") {
    if (!values.employee_code) errors.employee_code = "Sicil numarası girin.";
    else if (!EMPLOYEE_CODE_PATTERN.test(values.employee_code))
      errors.employee_code = "Yalnızca harf, rakam, nokta, tire ve alt çizgi kullanın.";
  }

  for (const [field, max] of Object.entries(MAX_LENGTHS) as [
    keyof typeof MAX_LENGTHS,
    number,
  ][]) {
    if (!errors[field] && values[field].length > max) {
      errors[field] = `En fazla ${max} karakter olabilir.`;
    }
  }

  if (values.hire_date) {
    const date = new Date(`${values.hire_date}T00:00:00Z`);
    if (!DATE_PATTERN.test(values.hire_date) || Number.isNaN(date.getTime())) {
      errors.hire_date = "Geçerli bir tarih seçin.";
    }
  }

  if (mode === "create" || password.length > 0) {
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Parola en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`;
    } else if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
      errors.password = "Parola çok uzun.";
    }
  }

  for (const kind of DRIVE_LINK_KINDS) {
    const link = values.drive_links[kind];
    if (link && (link.length > URL_MAX_LENGTH || !isSafeUrl(link))) {
      errors[`drive_links.${kind}`] = "https:// ile başlayan geçerli bir bağlantı girin.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, values, fieldErrors: errors };
  }

  return { ok: true, values, password: password.length > 0 ? password : null };
}

export function toDriveLinks(values: EmployeeFormValues): DriveLinks {
  const links: DriveLinks = {};
  for (const kind of DRIVE_LINK_KINDS) {
    if (values.drive_links[kind]) links[kind] = values.drive_links[kind];
  }
  return links;
}
