import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/** Anon anahtarla çalışan, RLS kurallarına tabi standart Supabase istemcisi. */
export function createBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ortam değişkenleri tanımlı olmalı.",
    );
  }

  browserClient = createClient(url, anonKey);

  return browserClient;
}
