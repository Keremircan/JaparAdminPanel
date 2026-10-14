import "server-only";

const PAGE_SIZE = 1000;

/** PostgREST tek istekte en fazla 1000 satır döndürdüğü için sayfalayarak okur. */
export async function fetchAllPages<Row>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
  label: string,
): Promise<Row[]> {
  const rows: Row[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${label} okunamadı: ${error.message}`);

    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}
