const block = "animate-pulse rounded-md bg-sunken";

export function OverviewSkeleton() {
  return (
    <div role="status" aria-label="Veriler yükleniyor" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-line bg-surface/80 p-5 shadow-card"
          >
            <div className="flex items-center gap-2.5">
              <div className={`${block} size-8 rounded-lg`} />
              <div className={`${block} h-4 w-32`} />
            </div>
            <div className={`${block} mt-3 h-9 w-16`} />
            <div className={`${block} mt-2 h-4 w-40`} />
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface/80 p-5 shadow-card xl:col-span-2">
          <div className={`${block} h-5 w-36`} />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className={`${block} h-5 w-full`} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface/80 p-5 shadow-card">
          <div className={`${block} h-5 w-36`} />
          <div className={`${block} mt-6 h-56 w-full`} />
        </div>
      </div>
    </div>
  );
}
