import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "./session";

/**
 * Service role istemcisine dokunan her Server Action ve veri fonksiyonunun
 * başında çağrılmalı. proxy.ts sayfaları korur, ancak Server Action'lar
 * doğrudan POST ile de tetiklenebildiği için kontrol burada tekrarlanır.
 */
export async function requireSession(): Promise<void> {
  // Oturum süresi şimdiki zamanla karşılaştırılır. Çerezler oturuma özel ön
  // yüklemede (prefetch) de okunabildiği için cookies() tek başına yetmez;
  // connection() bu kontrolü ve sonrasını kesin olarak istek anına bırakır.
  await connection();

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    redirect("/login");
  }
}
