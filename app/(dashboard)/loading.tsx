import { card } from "@/components/ui/styles";

const block = "animate-pulse rounded-md bg-sunken";

/**
 * Bir sayfanın iskeleti henüz önceden yüklenmemişken gezinmede anında
 * gösterilir. Sayfalar kendi verilerini ayrıca Suspense ile akıttığı için
 * çoğu gezinmede doğrudan sayfanın kendi iskeleti görünür.
 */
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Sayfa yükleniyor" className="space-y-6">
      <div className="space-y-2.5">
        <div className={`${block} h-7 w-48`} />
        <div className={`${block} h-4 w-80 max-w-full`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`${card} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div className={`${block} mt-1.5 h-4 w-28`} />
              <div className={`${block} size-8 rounded-lg`} />
            </div>
            <div className={`${block} mt-3 h-9 w-16`} />
            <div className={`${block} mt-2 h-4 w-36`} />
          </div>
        ))}
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="space-y-2">
            <div className={`${block} h-5 w-36`} />
            <div className={`${block} h-4 w-52`} />
          </div>
          <div className={`${block} h-9 w-24 rounded-lg`} />
        </div>
        <div className="divide-y divide-line border-t border-line">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex items-center gap-6 px-5 py-3.5">
              <div className={`${block} h-4 w-16`} />
              <div className={`${block} h-4 w-40`} />
              <div className={`${block} h-4 w-14`} />
              <div className={`${block} h-5 w-16 rounded-md`} />
              <div className={`${block} ml-auto h-4 w-24`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
