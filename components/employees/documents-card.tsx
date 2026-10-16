"use client";

import { startTransition, useActionState, useState, useTransition, type ReactNode } from "react";
import {
  CircleAlert,
  ExternalLink,
  FileCheck,
  FileText,
  HeartPulse,
  LoaderCircle,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import {
  buttonPrimary,
  buttonSecondary,
  card,
  iconButton,
  input,
} from "@/components/ui/styles";
import { formatDateTime } from "@/lib/date-utils";
import {
  addEmployeeDocument,
  removeEmployeeDocument,
  type DocumentFormField,
  type DocumentFormState,
} from "@/lib/employees/document-actions";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  documentTitle,
  type DocumentCategory,
  type EmployeeDocument,
} from "@/lib/employees/types";

const CATEGORY_STYLES: Record<DocumentCategory, { badge: string; icon: string; Icon: LucideIcon }> = {
  "sağlık raporu": {
    badge: "border-accent/20 bg-accent/10 text-accent",
    icon: "bg-accent/10 text-accent",
    Icon: HeartPulse,
  },
  "izin belgesi": {
    badge: "border-ok/20 bg-ok/10 text-ok",
    icon: "bg-ok/10 text-ok",
    Icon: FileCheck,
  },
  diğer: {
    badge: "border-line bg-sunken text-ink-soft",
    icon: "bg-sunken text-ink-soft",
    Icon: FileText,
  },
};

const initialState: DocumentFormState = { status: "idle" };

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Field({
  name,
  label,
  error,
  children,
}: {
  name: DocumentFormField;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={`document-${name}`} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`document-${name}-error`} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function AddDocumentForm({ employeeCode, onDone }: { employeeCode: string; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (previousState: DocumentFormState, formData: FormData) => {
      const result = await addEmployeeDocument(employeeCode, previousState, formData);
      if (result.status === "success") {
        toast.success(result.message);
        onDone();
        return initialState;
      }
      if (result.message) toast.error(result.message);
      return result;
    },
    initialState,
  );

  const errors = state.fieldErrors ?? {};
  const invalid = (name: DocumentFormField) => ({
    id: `document-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `document-${name}-error` : undefined,
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // action prop yerine: hatalı gönderimde girilen değerler silinmesin.
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <div className="space-y-5 px-6 py-5">
        <Field name="url" label="Belge bağlantısı" error={errors.url}>
          <input
            {...invalid("url")}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoFocus
            placeholder="Google Drive linkini yapıştırın"
            className={input}
          />
        </Field>
        <Field name="category" label="Kategori" error={errors.category}>
          <select {...invalid("category")} defaultValue="" className={input}>
            <option value="" disabled>
              Kategori seçin
            </option>
            {DOCUMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {DOCUMENT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </Field>
        <Field name="title" label="Belge adı (isteğe bağlı)" error={errors.title}>
          <input
            {...invalid("title")}
            type="text"
            autoComplete="off"
            maxLength={120}
            placeholder="Örn: 2026 Yıllık İzin Formu"
            className={input}
          />
          {!errors.title && (
            <p className="text-sm text-ink-faint">
              Boş bırakılırsa kategori ve bugünün tarihi kullanılır.
            </p>
          )}
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line bg-sunken/40 px-6 py-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={isPending} className={buttonSecondary}>
          Vazgeç
        </button>
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          {isPending ? "Kaydediliyor" : "Belgeyi kaydet"}
        </button>
      </div>
    </form>
  );
}

export function DocumentsCard({
  employeeCode,
  documents,
  className = "",
}: {
  employeeCode: string;
  documents: EmployeeDocument[];
  className?: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EmployeeDocument | null>(null);
  const [isDeleting, startDelete] = useTransition();

  // En son eklenen üstte.
  const sorted = [...documents].reverse();

  const confirmDelete = () => {
    const document = pendingDelete;
    if (!document) return;
    startDelete(async () => {
      const result = await removeEmployeeDocument(employeeCode, document.id);
      if (result.ok) {
        toast.success(result.message);
        setPendingDelete(null);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <section className={`${card} ${className}`}>
      <header className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Personel belgeleri ve dokümanlar
          </h2>
          <p className="mt-0.5 text-sm text-ink-faint">
            {documents.length > 0
              ? `${documents.length.toLocaleString("tr-TR")} belge. Bağlantılar yeni sekmede açılır.`
              : "Drive'daki raporları ve izin belgelerini buraya bağlayın."}
          </p>
        </div>
        <button type="button" onClick={() => setIsAdding(true)} className={buttonPrimary}>
          <Plus aria-hidden className="size-4" />
          Yeni belge ekle
        </button>
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center border-t border-line px-6 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
            <FileText aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-base font-medium text-ink">Henüz doküman eklenmemiş</p>
          <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
            Sağlık raporu, izin belgesi veya diğer belgelerin Google Drive bağlantısını
            ekleyin. Dosyalar Drive&apos;da kalır.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {sorted.map((document) => {
            const style = CATEGORY_STYLES[document.category];
            const title = documentTitle(document);
            return (
              <li key={document.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${style.icon}`}
                >
                  <style.Icon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-medium text-ink">{title}</span>
                    <span
                      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${style.badge}`}
                    >
                      {DOCUMENT_CATEGORY_LABELS[document.category]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-faint">
                    {document.created_at
                      ? `${formatDateTime(document.created_at)} tarihinde eklendi`
                      : "Eklenme tarihi bilinmiyor"}
                    , {hostname(document.url)}
                  </p>
                </div>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonSecondary} h-8 px-2.5`}
                >
                  <ExternalLink aria-hidden className="size-4" />
                  <span className="hidden sm:inline">Görüntüle</span>
                  <span className="sr-only">{title} (yeni sekmede açılır)</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPendingDelete(document)}
                  aria-label={`${title}: Sil`}
                  title="Sil"
                  className={`${iconButton} hover:bg-danger/10 hover:text-danger`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={isAdding}
        onOpenChange={setIsAdding}
        title="Yeni belge ekle"
        description="Belgenin Google Drive paylaşım bağlantısını ve kategorisini girin."
      >
        <AddDocumentForm employeeCode={employeeCode} onDone={() => setIsAdding(false)} />
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Belge silinsin mi?"
        description={
          pendingDelete && (
            <>
              <strong className="font-medium text-ink">{documentTitle(pendingDelete)}</strong>{" "}
              bağlantısı personelin belgelerinden kaldırılır. Drive&apos;daki dosya silinmez.
            </>
          )
        }
        confirmLabel="Sil"
        pendingLabel="Siliniyor"
        tone="danger"
        isPending={isDeleting}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
