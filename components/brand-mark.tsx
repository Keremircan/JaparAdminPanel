/** Saat kadranı üzerinde giriş işaretini andıran Japar PDKS amblemi. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-ink text-canvas ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[62%]">
        <circle
          cx="12"
          cy="12"
          r="8.25"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.45"
        />
        <path
          d="M12 7.5V12l3 2.25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
