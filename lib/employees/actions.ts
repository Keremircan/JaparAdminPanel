"use server";

import bcrypt from "bcryptjs";
import { refresh } from "next/cache";

import { requireSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/server";

import {
  parseEmployeeForm,
  toDriveLinks,
  type EmployeeFormState,
  type EmployeeFormValues,
} from "./form";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

// Mobil uygulamadaki bcryptjs maliyetiyle aynı (JaparQrNext/app/api/login).
const BCRYPT_ROUNDS = 10;

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

function toRow(values: EmployeeFormValues) {
  return {
    full_name: values.full_name,
    department: values.department || null,
    job: values.job || null,
    shift_type: values.shift_type || null,
    shift: values.shift || null,
    hire_date: values.hire_date || null,
    is_active: values.is_active,
    drive_links: toDriveLinks(values),
  };
}

export async function createEmployee(
  _previousState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await requireSession();

  const parsed = parseEmployeeForm(formData, "create");
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Formdaki işaretli alanları düzeltin.",
      fieldErrors: parsed.fieldErrors,
      values: parsed.values,
    };
  }

  const { values, password } = parsed;
  const { error } = await createAdminClient()
    .from("employees")
    .insert({
      ...toRow(values),
      employee_code: values.employee_code,
      password_hash: await bcrypt.hash(password!, BCRYPT_ROUNDS),
    });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        status: "error",
        message: "Bu sicil numarası başka bir çalışana ait.",
        fieldErrors: { employee_code: "Bu sicil numarası zaten kayıtlı." },
        values,
      };
    }
    return { status: "error", message: `Çalışan eklenemedi: ${error.message}`, values };
  }

  refresh();
  return {
    status: "success",
    message: `${values.full_name} eklendi.`,
    employeeCode: values.employee_code,
  };
}

/** Sicil numarası mobil girişin anahtarı olduğu için düzenlemede değiştirilmez. */
export async function updateEmployee(
  employeeCode: string,
  _previousState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await requireSession();

  const parsed = parseEmployeeForm(formData, "edit");
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Formdaki işaretli alanları düzeltin.",
      fieldErrors: parsed.fieldErrors,
      values: { ...parsed.values, employee_code: employeeCode },
    };
  }

  const { values, password } = parsed;
  const { data, error } = await createAdminClient()
    .from("employees")
    .update({
      ...toRow(values),
      ...(password ? { password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS) } : {}),
    })
    .eq("employee_code", employeeCode)
    .select("employee_code");

  if (error) {
    return {
      status: "error",
      message: `Değişiklikler kaydedilemedi: ${error.message}`,
      values: { ...values, employee_code: employeeCode },
    };
  }
  if (!data?.length) {
    return { status: "error", message: "Çalışan bulunamadı; silinmiş olabilir." };
  }

  refresh();
  return {
    status: "success",
    message: "Değişiklikler kaydedildi.",
    employeeCode,
  };
}

export async function setEmployeeActive(
  employeeCode: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireSession();

  const { data, error } = await createAdminClient()
    .from("employees")
    .update({ is_active: isActive })
    .eq("employee_code", employeeCode)
    .select("full_name");

  if (error) return { ok: false, message: `Durum değiştirilemedi: ${error.message}` };
  if (!data?.length) return { ok: false, message: "Çalışan bulunamadı." };

  refresh();
  return {
    ok: true,
    message: isActive
      ? `${data[0].full_name} aktifleştirildi.`
      : `${data[0].full_name} pasife alındı.`,
  };
}

export async function deleteEmployee(employeeCode: string): Promise<ActionResult> {
  await requireSession();

  const supabase = createAdminClient();

  // Yabancı anahtar da engeller; ancak kısıtın silme kuralına güvenmeden
  // hareket geçmişi olan kaydın silinmesini burada da reddediyoruz.
  const { count, error: countError } = await supabase
    .from("attendance_logs")
    .select("id", { count: "exact", head: true })
    .eq("employee_code", employeeCode);

  if (countError) return { ok: false, message: `Çalışan silinemedi: ${countError.message}` };
  if (count) {
    return {
      ok: false,
      message:
        "Bu çalışanın hareket kayıtları olduğu için silinemez. Kayıtları korumak için pasife alın.",
    };
  }

  const { data, error } = await supabase
    .from("employees")
    .delete()
    .eq("employee_code", employeeCode)
    .select("full_name");

  if (error) {
    if (error.code === FOREIGN_KEY_VIOLATION) {
      return {
        ok: false,
        message:
          "Bu çalışanın hareket kayıtları olduğu için silinemez. Kayıtları korumak için pasife alın.",
      };
    }
    return { ok: false, message: `Çalışan silinemedi: ${error.message}` };
  }
  if (!data?.length) return { ok: false, message: "Çalışan bulunamadı." };

  refresh();
  return { ok: true, message: `${data[0].full_name} silindi.` };
}

export async function resetEmployeeDevice(employeeCode: string): Promise<ActionResult> {
  await requireSession();

  const { data, error } = await createAdminClient().rpc("reset_employee_device", {
    p_employee_code: employeeCode,
  });

  if (error) return { ok: false, message: `Cihaz sıfırlanamadı: ${error.message}` };
  if (data !== true) return { ok: false, message: "Çalışan bulunamadı." };

  refresh();
  return {
    ok: true,
    message: "Cihaz sıfırlandı. Çalışanın bir sonraki girişinde yeni telefonu bağlanacak.",
  };
}
