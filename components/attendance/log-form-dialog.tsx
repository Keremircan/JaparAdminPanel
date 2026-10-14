"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary, buttonSecondary, input } from "@/components/ui/styles";
import {
  createManualLog,
  updateLog,
  type LogFormField,
  type LogFormState,
} from "@/lib/attendance/actions";
import type { AttendanceEmployee, AttendanceLog } from "@/lib/attendance/types";
import { formatDateTime, toIstanbulDateTimeInput } from "@/lib/date-utils";

export type LogDialogTarget =
  | { kind: "create"; openedAt: string }
  | { kind: "edit"; log: AttendanceLog; employee: AttendanceEmployee | undefined };

const initialState: LogFormState = { status: "idle" };

function Field({
  name,
  label,
  error,
  children,
}: {
  name: LogFormField;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function LogForm({
  target,
  employees,
  onDone,
}: {
  target: LogDialogTarget;
  employees: AttendanceEmployee[];
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (previousState: LogFormState, formData: FormData) => {
      const result =
        target.kind === "create"
          ? await createManualLog(previousState, formData)
          : await updateLog(target.log.id, previousState, formData);

      // Sonuç gönderimin içinde işlenir; form bir sonraki açılışta sıfırdan kurulur.
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
  const invalid = (name: LogFormField) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  const defaultTime =
    target.kind === "create"
      ? toIstanbulDateTimeInput(target.openedAt)
      : toIstanbulDateTimeInput(target.log.created_at);
  const maxTime = toIstanbulDateTimeInput(
    target.kind === "create" ? target.openedAt : new Date(),
  );

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // action prop yerine: React hatalı gönderimden sonra formu sıfırlamasın,
        // girilen değerler (seçim kutuları dahil) yerinde kalsın.
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <div className="space-y-5 px-6 py-5">
        {target.kind === "create" ? (
          <Field name="employee_code" label="Çalışan" error={errors.employee_code}>
            <EmployeeCombobox
              id="employee_code"
              name="employee_code"
              employees={employees.filter((employee) => employee.is_active)}
              invalid={Boolean(errors.employee_code)}
              describedBy={errors.employee_code ? "employee_code-error" : undefined}
            />
          </Field>
        ) : (
          <div className="rounded-xl border border-line bg-sunken/40 px-4 py-3 text-sm">
            <p className="font-medium text-ink">
              {target.employee?.full_name ?? "Kayıtlı olmayan personel"}
            </p>
            <p className="mt-0.5 text-ink-faint">
              <span className="font-mono">{target.log.employee_code}</span>, kayıtlı saat{" "}
              {formatDateTime(target.log.created_at, { seconds: true })}
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="log_type" label="Hareket tipi" error={errors.log_type}>
            <select
              id="log_type"
              name="log_type"
              defaultValue={target.kind === "edit" ? target.log.log_type : "IN"}
              className={input}
              {...invalid("log_type")}
            >
              <option value="IN">Giriş (IN)</option>
              <option value="OUT">Çıkış (OUT)</option>
            </select>
          </Field>
          <Field name="occurred_at" label="Tarih ve saat" error={errors.occurred_at}>
            <input
              id="occurred_at"
              name="occurred_at"
              type="datetime-local"
              step={60}
              defaultValue={defaultTime}
              max={maxTime}
              className={`${input} tabular-nums`}
              {...invalid("occurred_at")}
            />
          </Field>
        </div>
        <p className="-mt-2 text-sm text-ink-faint">Saat, Türkiye saatine göre girilir.</p>

        <Field name="note" label="Not (isteğe bağlı)" error={errors.note}>
          <textarea
            id="note"
            name="note"
            rows={2}
            maxLength={500}
            defaultValue={target.kind === "edit" ? (target.log.note ?? "") : ""}
            placeholder={
              target.kind === "create"
                ? "Örnek: Telefonunu evde unuttu, amir onayıyla girildi."
                : "Örnek: Okutma saati yanlış kaydedilmiş."
            }
            className={`${input} h-auto resize-none py-2`}
            {...invalid("note")}
          />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line bg-sunken/40 px-6 py-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} disabled={isPending} className={buttonSecondary}>
          Vazgeç
        </button>
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          {target.kind === "create"
            ? isPending
              ? "Ekleniyor"
              : "Hareketi ekle"
            : isPending
              ? "Kaydediliyor"
              : "Değişiklikleri kaydet"}
        </button>
      </div>
    </form>
  );
}

export function LogFormDialog({
  target,
  employees,
  onClose,
}: {
  target: LogDialogTarget | null;
  employees: AttendanceEmployee[];
  onClose: () => void;
}) {
  return (
    <Modal
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={target?.kind === "edit" ? "Hareketi düzelt" : "Manuel hareket ekle"}
      description={
        target?.kind === "edit"
          ? "Yanlış kaydedilen saati veya hareket tipini düzeltin. Kayıt düzeltildi olarak işaretlenir."
          : "Telefonu yanında olmayan veya okutma yapamayan çalışan için hareketi elle girin."
      }
    >
      {target && <LogForm target={target} employees={employees} onDone={onClose} />}
    </Modal>
  );
}
