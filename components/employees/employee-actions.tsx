"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  buttonDangerGhost,
  buttonSecondary,
  iconButton,
} from "@/components/ui/styles";
import {
  deleteEmployee,
  resetEmployeeDevice,
  setEmployeeActive,
  type ActionResult,
} from "@/lib/employees/actions";

type EmployeeRef = { code: string; name: string };

/** Onaylanan işlemi çalıştırıp sonucu bildirim olarak gösterir. */
function useConfirmedAction(run: () => Promise<ActionResult>, onSuccess?: () => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await run();
      if (result.ok) {
        toast.success(result.message);
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.message);
      }
    });

  return { isOpen, setIsOpen, isPending, confirm };
}

export function StatusToggleButton({
  employee,
  isActive,
  compact = false,
}: {
  employee: EmployeeRef;
  isActive: boolean;
  compact?: boolean;
}) {
  const action = useConfirmedAction(() => setEmployeeActive(employee.code, !isActive));
  const label = isActive ? "Pasife al" : "Aktifleştir";
  const Icon = isActive ? PowerOff : Power;

  return (
    <>
      <button
        type="button"
        onClick={() => action.setIsOpen(true)}
        aria-label={compact ? `${employee.name}: ${label}` : undefined}
        title={compact ? label : undefined}
        className={compact ? iconButton : buttonSecondary}
      >
        <Icon aria-hidden className="size-4" />
        {!compact && label}
      </button>
      <ConfirmDialog
        open={action.isOpen}
        onOpenChange={action.setIsOpen}
        title={isActive ? "Çalışan pasife alınsın mı?" : "Çalışan aktifleştirilsin mi?"}
        description={
          isActive ? (
            <>
              <strong className="font-medium text-ink">{employee.name}</strong> mobil
              uygulamaya giriş yapamaz ve karekod okutamaz. Geçmiş hareket kayıtları
              korunur.
            </>
          ) : (
            <>
              <strong className="font-medium text-ink">{employee.name}</strong> yeniden
              giriş yapıp karekod okutabilir.
            </>
          )
        }
        confirmLabel={label}
        pendingLabel={isActive ? "Pasife alınıyor" : "Aktifleştiriliyor"}
        tone={isActive ? "danger" : "default"}
        isPending={action.isPending}
        onConfirm={action.confirm}
      />
    </>
  );
}

export function DeleteEmployeeButton({
  employee,
  compact = false,
  redirectTo,
}: {
  employee: EmployeeRef;
  compact?: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const action = useConfirmedAction(
    () => deleteEmployee(employee.code),
    redirectTo ? () => router.push(redirectTo) : undefined,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => action.setIsOpen(true)}
        aria-label={compact ? `${employee.name}: Sil` : undefined}
        title={compact ? "Sil" : undefined}
        className={
          compact
            ? `${iconButton} hover:bg-danger/10 hover:text-danger`
            : buttonDangerGhost
        }
      >
        <Trash2 aria-hidden className="size-4" />
        {!compact && "Sil"}
      </button>
      <ConfirmDialog
        open={action.isOpen}
        onOpenChange={action.setIsOpen}
        title="Çalışan kalıcı olarak silinsin mi?"
        description={
          <>
            <strong className="font-medium text-ink">{employee.name}</strong> (
            {employee.code}) kaydı silinir ve geri alınamaz. Hareket kaydı olan çalışanlar
            silinemez; bu durumda pasife alın.
          </>
        }
        confirmLabel="Sil"
        pendingLabel="Siliniyor"
        tone="danger"
        isPending={action.isPending}
        onConfirm={action.confirm}
      />
    </>
  );
}

export function ResetDeviceButton({
  employee,
  disabled,
}: {
  employee: EmployeeRef;
  disabled: boolean;
}) {
  const action = useConfirmedAction(() => resetEmployeeDevice(employee.code));

  return (
    <>
      <button
        type="button"
        onClick={() => action.setIsOpen(true)}
        disabled={disabled}
        className={buttonSecondary}
      >
        <RotateCcw aria-hidden className="size-4" />
        Cihazı sıfırla
      </button>
      <ConfirmDialog
        open={action.isOpen}
        onOpenChange={action.setIsOpen}
        title="Cihaz sıfırlansın mı?"
        description={
          <>
            <strong className="font-medium text-ink">{employee.name}</strong> için kayıtlı
            telefonun bağlantısı kaldırılır. Çalışan bir sonraki girişinde kullandığı
            telefonu yeniden bağlar. İşlem cihaz geçmişine kaydedilir.
          </>
        }
        confirmLabel="Cihazı sıfırla"
        pendingLabel="Sıfırlanıyor"
        tone="danger"
        isPending={action.isPending}
        onConfirm={action.confirm}
      />
    </>
  );
}
