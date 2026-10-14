"use server";

import { refresh } from "next/cache";

import { requireSession } from "@/lib/auth/guard";
import { fromIstanbulDateTimeInput } from "@/lib/date-utils";
import type { ActionResult } from "@/lib/employees/actions";
import { createAdminClient } from "@/lib/supabase/server";

export type LogFormField = "employee_code" | "log_type" | "occurred_at" | "note";

export type LogFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<LogFormField, string>>;
};

const NOTE_MAX_LENGTH = 500;
// İstemci ile sunucu saati arasındaki küçük farklara tolerans.
const FUTURE_TOLERANCE_MS = 60_000;
// PostgREST: istenen kolon şema önbelleğinde yok (migration çalıştırılmamış).
const UNKNOWN_COLUMN = "PGRST204";
const MIGRATION_HINT =
  "Veritabanı güncellemesi eksik: supabase/migrations/20261014150000_attendance_manual_logs_and_realtime.sql dosyasını Supabase SQL Editor'de çalıştırın.";

type ParsedLogForm =
  | { ok: true; logType: "IN" | "OUT"; occurredAt: Date; note: string | null }
  | { ok: false; fieldErrors: NonNullable<LogFormState["fieldErrors"]> };

function parseLogForm(formData: FormData): ParsedLogForm {
  const errors: NonNullable<LogFormState["fieldErrors"]> = {};

  const logType = formData.get("log_type");
  if (logType !== "IN" && logType !== "OUT") errors.log_type = "Hareket tipini seçin.";

  const rawOccurredAt = formData.get("occurred_at");
  const occurredAt =
    typeof rawOccurredAt === "string" ? fromIstanbulDateTimeInput(rawOccurredAt) : null;
  if (!occurredAt) errors.occurred_at = "Tarih ve saati seçin.";
  else if (occurredAt.getTime() > Date.now() + FUTURE_TOLERANCE_MS)
    errors.occurred_at = "İleri bir tarih ve saat girilemez.";

  const rawNote = formData.get("note");
  const note = typeof rawNote === "string" ? rawNote.trim().replace(/\s+/g, " ") : "";
  if (note.length > NOTE_MAX_LENGTH) errors.note = `Not en fazla ${NOTE_MAX_LENGTH} karakter olabilir.`;

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return {
    ok: true,
    logType: logType as "IN" | "OUT",
    occurredAt: occurredAt!,
    note: note || null,
  };
}

const typeLabel = (type: "IN" | "OUT") => (type === "IN" ? "Giriş" : "Çıkış");

export async function createManualLog(
  _previousState: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  await requireSession();

  const parsed = parseLogForm(formData);
  const employeeCode = formData.get("employee_code");
  const fieldErrors = parsed.ok ? {} : { ...parsed.fieldErrors };
  if (typeof employeeCode !== "string" || !employeeCode) {
    fieldErrors.employee_code = "Çalışanı seçin.";
  }
  if (!parsed.ok || fieldErrors.employee_code) {
    return { status: "error", message: "Formdaki işaretli alanları düzeltin.", fieldErrors };
  }

  const supabase = createAdminClient();
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("full_name")
    .eq("employee_code", employeeCode as string)
    .maybeSingle();

  if (employeeError) return { status: "error", message: employeeError.message };
  if (!employee) {
    return {
      status: "error",
      message: "Çalışan bulunamadı.",
      fieldErrors: { employee_code: "Bu sicil numarasıyla kayıtlı çalışan yok." },
    };
  }

  const { error } = await supabase.from("attendance_logs").insert({
    employee_code: employeeCode as string,
    log_type: parsed.logType,
    created_at: parsed.occurredAt.toISOString(),
    source: "manual",
    note: parsed.note,
  });

  if (error) {
    return {
      status: "error",
      message: error.code === UNKNOWN_COLUMN ? MIGRATION_HINT : `Hareket eklenemedi: ${error.message}`,
    };
  }

  refresh();
  return {
    status: "success",
    message: `${employee.full_name} için manuel ${typeLabel(parsed.logType).toLocaleLowerCase("tr")} eklendi.`,
  };
}

export async function updateLog(
  logId: number,
  _previousState: LogFormState,
  formData: FormData,
): Promise<LogFormState> {
  await requireSession();

  const parsed = parseLogForm(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Formdaki işaretli alanları düzeltin.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const { data, error } = await createAdminClient()
    .from("attendance_logs")
    .update({
      log_type: parsed.logType,
      created_at: parsed.occurredAt.toISOString(),
      note: parsed.note,
      edited_at: new Date().toISOString(),
    })
    .eq("id", logId)
    .select("id");

  if (error) {
    return {
      status: "error",
      message:
        error.code === UNKNOWN_COLUMN ? MIGRATION_HINT : `Hareket güncellenemedi: ${error.message}`,
    };
  }
  if (!data?.length) return { status: "error", message: "Hareket bulunamadı; silinmiş olabilir." };

  refresh();
  return { status: "success", message: "Hareket güncellendi." };
}

export async function deleteLog(logId: number): Promise<ActionResult> {
  await requireSession();

  const { data, error } = await createAdminClient()
    .from("attendance_logs")
    .delete()
    .eq("id", logId)
    .select("id");

  if (error) return { ok: false, message: `Hareket silinemedi: ${error.message}` };
  if (!data?.length) return { ok: false, message: "Hareket bulunamadı; zaten silinmiş olabilir." };

  refresh();
  return { ok: true, message: "Hareket silindi." };
}
