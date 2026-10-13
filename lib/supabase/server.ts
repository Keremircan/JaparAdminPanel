import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;

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
  });

  return adminClient;
}
