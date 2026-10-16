"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";

import { requireSession } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/server";

import type { ActionResult } from "./actions";
import { isDocumentCategory, isSafeUrl, type EmployeeDocument } from "./types";

export type DocumentFormField = "url" | "category" | "title";

export type DocumentFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<DocumentFormField, string>>;
};

const URL_MAX_LENGTH = 2000;
const TITLE_MAX_LENGTH = 120;

// PostgREST: fonksiyon bulunamadı / check kısıtı ihlali (migration çalıştırılmamış).
const FUNCTION_NOT_FOUND = "PGRST202";
const CHECK_VIOLATION = "23514";
const MIGRATION_HINT =
  "Veritabanı güncellemesi eksik: supabase/migrations/20261016150000_employee_documents.sql dosyasını Supabase SQL Editor'de çalıştırın.";

function databaseMessage(error: { code?: string; message: string }, fallback: string) {
  return error.code === FUNCTION_NOT_FOUND || error.code === CHECK_VIOLATION
    ? MIGRATION_HINT
    : `${fallback}: ${error.message}`;
}

export async function addEmployeeDocument(
  employeeCode: string,
  _previousState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  await requireSession();

  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const url = text("url");
  const category = text("category");
  const title = text("title").replace(/\s+/g, " ");

  const fieldErrors: NonNullable<DocumentFormState["fieldErrors"]> = {};
  if (!url) fieldErrors.url = "Belge bağlantısını yapıştırın.";
  else if (url.length > URL_MAX_LENGTH || !isSafeUrl(url))
    fieldErrors.url = "https:// ile başlayan geçerli bir bağlantı girin.";
  if (!isDocumentCategory(category)) fieldErrors.category = "Kategori seçin.";
  if (title.length > TITLE_MAX_LENGTH)
    fieldErrors.title = `Başlık en fazla ${TITLE_MAX_LENGTH} karakter olabilir.`;

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Formdaki işaretli alanları düzeltin.", fieldErrors };
  }

  const document: EmployeeDocument = {
    id: randomUUID(),
    url,
    category: category as EmployeeDocument["category"],
    created_at: new Date().toISOString(),
    ...(title ? { title } : {}),
  };

  const { data, error } = await createAdminClient().rpc("add_employee_document", {
    p_employee_code: employeeCode,
    p_document: document,
  });

  if (error) return { status: "error", message: databaseMessage(error, "Belge eklenemedi") };
  if (data !== true) return { status: "error", message: "Çalışan bulunamadı." };

  refresh();
  return { status: "success", message: "Belge eklendi." };
}

export async function removeEmployeeDocument(
  employeeCode: string,
  documentId: string,
): Promise<ActionResult> {
  await requireSession();

  const { data, error } = await createAdminClient().rpc("remove_employee_document", {
    p_employee_code: employeeCode,
    p_document_id: documentId,
  });

  if (error) return { ok: false, message: databaseMessage(error, "Belge silinemedi") };
  if (data === null) return { ok: false, message: "Çalışan bulunamadı." };

  refresh();
  return data > 0
    ? { ok: true, message: "Belge silindi." }
    : { ok: false, message: "Belge bulunamadı; zaten silinmiş olabilir." };
}
