"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isAuthConfigured,
  isValidPassword,
} from "./session";

export type LoginState = { error: string | null };

const FAILED_ATTEMPT_DELAY_MS = 600;

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return {
      error:
        "Sunucuda ADMIN_PANEL_PASSWORD tanımlı değil. Ortam değişkenlerini kontrol edin.",
    };
  }

  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Parolayı girin." };
  }

  if (!isValidPassword(password)) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS));
    return { error: "Parola hatalı. Tekrar deneyin." };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
