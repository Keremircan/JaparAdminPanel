import { card } from "@/components/ui/styles";

const block = "animate-pulse rounded-md bg-sunken";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Yükleniyor" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className={`${block} h-10 md:w-80`} />
        <div className={`${block} h-10 md:w-48`} />
        <div className={`${block} h-10 w-52`} />
      </div>
      <div className={`${card} space-y-4 p-5`}>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className={`${block} h-6 w-full`} />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div role="status" aria-label="Yükleniyor" className={`${card} space-y-6 p-6`}>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="grid gap-5 lg:grid-cols-[16rem_1fr]">
          <div className={`${block} h-5 w-32`} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className={`${block} h-10`} />
            <div className={`${block} h-10`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Yükleniyor" className="space-y-6">
      <div className={`${block} h-4 w-24`} />
      <div className={`${card} flex items-center gap-4 p-6`}>
        <div className={`${block} size-14 rounded-full`} />
        <div className="space-y-2">
          <div className={`${block} h-6 w-48`} />
          <div className={`${block} h-4 w-32`} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${card} h-56`} />
        <div className={`${card} h-56 lg:col-span-2`} />
      </div>
      <div className={`${card} h-72`} />
    </div>
  );
}
