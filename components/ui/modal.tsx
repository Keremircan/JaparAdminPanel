"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { iconButton } from "./styles";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** İşlem sürerken Esc ve arka plan tıklaması pencereyi kapatmaz. */
  isBusy?: boolean;
  children: ReactNode;
};

/** Yerel `<dialog>` üzerine kurulu form penceresi. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  isBusy = false,
  children,
}: ModalProps) {
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
        if (isBusy) event.preventDefault();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isBusy) onOpenChange(false);
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-surface p-0 text-left whitespace-normal text-ink shadow-float backdrop:bg-ink/30 backdrop:backdrop-blur-sm open:animate-rise"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <div className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isBusy}
          aria-label="Kapat"
          className={`${iconButton} -mt-1 -mr-2`}
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      {open && children}
    </dialog>
  );
}
