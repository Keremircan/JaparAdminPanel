"use client";

import {
  startTransition,
  useActionState,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, FolderOpen, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { buttonPrimary, buttonSecondary, card, input } from "@/components/ui/styles";
import { createEmployee, updateEmployee } from "@/lib/employees/actions";
import {
  PASSWORD_MIN_LENGTH,
  type EmployeeFormField,
  type EmployeeFormState,
  type EmployeeFormValues,
} from "@/lib/employees/form";
import {
  DRIVE_LINK_KINDS,
  DRIVE_LINK_LABELS,
  employeePath,
} from "@/lib/employees/types";

const SHIFT_TYPES = ["Gündüz Vardiyası", "Gece Vardiyası"];

export const EMPTY_FORM_VALUES: EmployeeFormValues = {
  full_name: "",
  employee_code: "",
  department: "",
  job: "",
  shift_type: "",
  shift: "",
  hire_date: "",
  is_active: true,
  drive_links: { folder: "", health_report: "", leave_permit: "", other: "" },
};

const initialState: EmployeeFormState = { status: "idle" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-x-10 gap-y-5 border-t border-line px-6 py-7 first:border-t-0 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-faint">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  wide = false,
  children,
}: {
  name: EmployeeFormField;
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="flex items-start gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

type EmployeeFormProps = {
  mode: "create" | "edit";
  defaultValues: EmployeeFormValues;
  departments: string[];
};

/**
 * Cache Components ile Next.js, gezinilen sayfayı kaldırmak yerine
 * <Activity> ile gizler ve state'ini korur. Form gizlendiğinde anahtarı
 * değiştirerek bir sonraki açılışta sunucudan gelen güncel verilerle,
 * eski başarı/hata durumu olmadan sıfırdan kurulmasını sağlar.
 * Bkz. node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md
 */
export function EmployeeForm(props: EmployeeFormProps) {
  const [instance, setInstance] = useState(0);

  useLayoutEffect(() => {
    return () => setInstance((current) => current + 1);
  }, []);

  return <EmployeeFormFields key={instance} {...props} />;
}

function EmployeeFormFields({ mode, defaultValues, departments }: EmployeeFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (previousState: EmployeeFormState, formData: FormData) => {
      const result =
        mode === "create"
          ? await createEmployee(previousState, formData)
          : await updateEmployee(defaultValues.employee_code, previousState, formData);

      // Bildirim ve yönlendirme bir efektte değil gönderimin kendisinde yapılır;
      // böylece form yeniden göründüğünde eski sonuç tekrar işlenmez.
      if (result.status === "success" && result.employeeCode) {
        toast.success(result.message);
        router.push(employeePath(result.employeeCode));
        return initialState;
      }
      if (result.status === "error" && result.message) toast.error(result.message);
      return result;
    },
    initialState,
  );

  const errors = state.fieldErrors ?? {};
  const fieldProps = (name: EmployeeFormField) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  const cancelHref =
    mode === "create" ? "/employees" : employeePath(defaultValues.employee_code);

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
      className={card}
    >
      <Section
        title="Kimlik bilgileri"
        description="Sicil numarası mobil uygulamada kullanıcı adı olarak kullanılır."
      >
        <Field name="full_name" label="Ad soyad" error={errors.full_name}>
          <input
            {...fieldProps("full_name")}
            defaultValue={defaultValues.full_name}
            autoComplete="off"
            required
            maxLength={100}
            className={input}
          />
        </Field>
        <Field
          name="employee_code"
          label="Sicil no"
          error={errors.employee_code}
          hint={mode === "edit" ? "Sicil numarası kayıttan sonra değiştirilemez." : undefined}
        >
          <input
            {...fieldProps("employee_code")}
            defaultValue={defaultValues.employee_code}
            disabled={mode === "edit"}
            autoComplete="off"
            required
            maxLength={50}
            placeholder="EMP-1024"
            className={`${input} font-mono`}
          />
        </Field>
        <Field name="department" label="Departman" error={errors.department}>
          <input
            {...fieldProps("department")}
            defaultValue={defaultValues.department}
            list="department-options"
            autoComplete="off"
            maxLength={100}
            className={input}
          />
          <datalist id="department-options">
            {departments.map((department) => (
              <option key={department} value={department} />
            ))}
          </datalist>
        </Field>
        <Field name="hire_date" label="İşe giriş tarihi" error={errors.hire_date}>
          <input
            {...fieldProps("hire_date")}
            type="date"
            defaultValue={defaultValues.hire_date}
            className={input}
          />
        </Field>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-sunken/40 px-4 py-3 sm:col-span-2">
          <span>
            <span className="block text-sm font-medium text-ink">Aktif çalışan</span>
            <span className="block text-sm text-ink-faint">
              Pasif çalışanlar mobil uygulamaya giriş yapamaz.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="is_active"
            defaultChecked={defaultValues.is_active}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-11 shrink-0 rounded-full bg-ink-faint/40 transition-colors duration-200 ease-in-out peer-checked:bg-ok peer-focus-visible:ring-4 peer-focus-visible:ring-accent/30 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 after:ease-in-out peer-checked:after:translate-x-5"
          />
        </label>
      </Section>

      <Section
        title="Görev ve vardiya"
        description="Mobil uygulamanın ana sayfasında ve profilde gösterilir."
      >
        <Field name="job" label="Görev" error={errors.job}>
          <input
            {...fieldProps("job")}
            defaultValue={defaultValues.job}
            autoComplete="off"
            maxLength={100}
            className={input}
          />
        </Field>
        <Field name="shift_type" label="Vardiya tipi" error={errors.shift_type}>
          <select {...fieldProps("shift_type")} defaultValue={defaultValues.shift_type} className={input}>
            <option value="">Seçilmedi</option>
            {[...new Set([...SHIFT_TYPES, defaultValues.shift_type].filter(Boolean))].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field
          name="shift"
          label="Vardiya saatleri"
          error={errors.shift}
          hint="Örnek: 08:00 - 18:00"
        >
          <input
            {...fieldProps("shift")}
            defaultValue={defaultValues.shift}
            autoComplete="off"
            maxLength={50}
            className={input}
          />
        </Field>
      </Section>

      <Section
        title="Giriş parolası"
        description={
          mode === "create"
            ? "Çalışan mobil uygulamaya bu parolayla giriş yapar. İlk girişte telefonu kendiliğinden bağlanır."
            : "Boş bırakırsanız mevcut parola değişmez."
        }
      >
        <Field
          name="password"
          label={mode === "create" ? "Parola" : "Yeni parola"}
          error={errors.password}
          hint={`En az ${PASSWORD_MIN_LENGTH} karakter.`}
        >
          <input
            {...fieldProps("password")}
            type="password"
            autoComplete="new-password"
            required={mode === "create"}
            className={input}
          />
        </Field>
      </Section>

      <Section
        title="Doküman bağlantıları"
        description="Google Drive'daki klasör ve belgelerin paylaşım bağlantıları. Dosyalar Drive'da kalır."
      >
        {DRIVE_LINK_KINDS.map((kind) => (
          <Field
            key={kind}
            name={`drive_links.${kind}`}
            label={DRIVE_LINK_LABELS[kind]}
            error={errors[`drive_links.${kind}`]}
            wide={kind === "folder"}
          >
            <div className="relative">
              {kind === "folder" && (
                <FolderOpen
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
                />
              )}
              <input
                {...fieldProps(`drive_links.${kind}`)}
                type="url"
                inputMode="url"
                defaultValue={defaultValues.drive_links[kind]}
                placeholder="https://drive.google.com/…"
                autoComplete="off"
                className={`${input} ${kind === "folder" ? "pl-9" : ""}`}
              />
            </div>
          </Field>
        ))}
      </Section>

      <div className="flex flex-col-reverse gap-2 border-t border-line bg-sunken/40 px-6 py-4 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonSecondary}>
          Vazgeç
        </Link>
        <button type="submit" disabled={isPending} className={buttonPrimary}>
          {isPending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          {mode === "create"
            ? isPending
              ? "Ekleniyor"
              : "Çalışanı ekle"
            : isPending
              ? "Kaydediliyor"
              : "Değişiklikleri kaydet"}
        </button>
      </div>
    </form>
  );
}
