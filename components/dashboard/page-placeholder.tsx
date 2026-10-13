import type { LucideIcon } from "lucide-react";

type PagePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  upcoming: string;
};

/** Verisi henüz bağlanmamış sayfalar için başlık ve boş durum paneli. */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  upcoming,
}: PagePlaceholderProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 max-w-[65ch] text-[15px] leading-relaxed text-ink-soft">
        {description}
      </p>

      <section className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-surface/80 px-6 py-16 text-center shadow-card backdrop-blur-md">
        <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
          <Icon aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        <h2 className="mt-4 text-base font-medium text-ink">
          Bu bölüm henüz veriye bağlanmadı
        </h2>
        <p className="mt-1.5 max-w-[48ch] text-sm leading-relaxed text-ink-soft">
          {upcoming}
        </p>
      </section>
    </>
  );
}
