"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { buttonDanger, buttonPrimary, buttonSecondary } from "./styles";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  tone?: "default" | "danger";
  isPending?: boolean;
  onConfirm: () => void;
};

/** Yerel `<dialog>` üzerine kurulu onay penceresi: odak kilidi ve Esc ile kapanma tarayıcıdan gelir. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  tone = "default",
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
      onClick={(event) => {
        // Arka plana tıklama: dialog'un kendisine düşen tıklama içerik dışıdır.
        if (event.target === event.currentTarget && !isPending) onOpenChange(false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl text-left whitespace-normal border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-ink/30 backdrop:backdrop-blur-sm open:animate-rise"
    >
      <div className="p-6">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</div>
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-sunken/40 px-6 py-4">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className={buttonSecondary}
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className={tone === "danger" ? buttonDanger : buttonPrimary}
        >
          {isPending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          {isPending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
