/** Panel genelinde tekrar eden buton ve kart sınıfları. */

const buttonBase =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

export const buttonPrimary = `${buttonBase} bg-accent text-accent-ink shadow-sm hover:brightness-110 focus-visible:ring-4 focus-visible:ring-accent/30`;

export const buttonSecondary = `${buttonBase} border border-line bg-surface text-ink shadow-xs hover:bg-sunken focus-visible:ring-2 focus-visible:ring-accent/40`;

export const buttonDanger = `${buttonBase} bg-danger text-white shadow-sm hover:brightness-110 focus-visible:ring-4 focus-visible:ring-danger/30`;

export const buttonDangerGhost = `${buttonBase} text-danger hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-danger/40`;

export const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors duration-200 hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

export const card =
  "rounded-2xl border border-line bg-surface/80 shadow-card backdrop-blur-md";

export const input =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-xs transition-all duration-200 ease-in-out outline-none placeholder:text-ink-faint hover:border-ink-faint/50 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-soft aria-invalid:border-danger aria-invalid:focus:ring-danger/15";
