import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, verifySessionToken } from "./session";

/**
 * Service role istemcisine dokunan her Server Action ve veri fonksiyonunun
 * başında çağrılmalı. proxy.ts sayfaları korur, ancak Server Action'lar
 * doğrudan POST ile de tetiklenebildiği için kontrol burada tekrarlanır.
 */
export async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    redirect("/login");
  }
}
