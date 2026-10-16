import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Agent, fetch as undiciFetch } from "undici";

let adminClient: SupabaseClient | undefined;

/**
 * Supabase istekleri için bağlantı havuzu. Varsayılan fetch her paralel istek
 * için ayrı HTTPS bağlantısı açar ve boşta kalan bağlantıyı birkaç saniyede
 * kapatır; HTTP/2 tüm sorguları tek bağlantı üzerinden taşır, uzun keep-alive
 * de bir sonraki sayfa açılışında TLS el sıkışmasını tekrar etmez.
 */
const supabaseDispatcher = new Agent({
  allowH2: true,
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 300_000,
});

const pooledFetch: typeof fetch = (input, init) =>
  undiciFetch(
    input as Parameters<typeof undiciFetch>[0],
    { ...init, dispatcher: supabaseDispatcher } as Parameters<typeof undiciFetch>[1],
  ) as unknown as Promise<Response>;

/**
 * Service role anahtarıyla çalışan, RLS'i atlayan Supabase istemcisi.
 * `server-only` importu sayesinde bu modül bir Client Component'e
 * aktarılırsa derleme hata verir; anahtar tarayıcı paketine giremez.
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri tanımlı olmalı.",
    );
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: pooledFetch },
  });

  return adminClient;
}
