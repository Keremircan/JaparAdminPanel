import type { Metadata } from "next";

import { BrandMark } from "@/components/brand-mark";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Giriş",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="dot-grid absolute inset-0" />
      <div
        aria-hidden
        className="absolute top-[18%] left-1/2 h-[420px] w-[640px] max-w-[120vw] -translate-x-1/2 rounded-full bg-accent/15 blur-[110px]"
      />

      <div className="relative w-full max-w-[400px] animate-rise">
        <div className="rounded-2xl border border-line bg-surface/80 p-8 shadow-float backdrop-blur-md sm:p-9">
          <div className="flex items-center gap-3">
            <BrandMark className="size-10" />
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight text-ink">
                Japar PDKS
              </p>
              <p className="text-sm text-ink-faint">Yönetim paneli</p>
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-ink">
            Panele giriş yapın
          </h1>
          <p className="mt-2 mb-7 text-[15px] leading-relaxed text-ink-soft">
            Çalışan kayıtları ve giriş-çıkış hareketleri yalnızca yetkili
            yöneticilere açıktır.
          </p>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-ink-faint">
          Oturum 12 saat sonra kendiliğinden kapanır.
        </p>
      </div>
    </main>
  );
}
