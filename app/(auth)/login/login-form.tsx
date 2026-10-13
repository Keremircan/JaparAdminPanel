"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";

import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Yönetici parolası
        </label>
        <div className="group relative">
          <LockKeyhole
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint transition-colors duration-200 group-focus-within:text-accent"
          />
          <input
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "login-error" : undefined}
            className="h-11 w-full rounded-xl border border-line bg-surface pr-11 pl-10 text-[15px] text-ink shadow-xs transition-all duration-200 ease-in-out outline-none placeholder:text-ink-faint hover:border-ink-faint/50 focus:border-accent focus:ring-4 focus:ring-accent/15 aria-invalid:border-danger aria-invalid:focus:ring-danger/15"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? "Parolayı gizle" : "Parolayı göster"}
            aria-pressed={isPasswordVisible}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint transition-colors duration-200 hover:bg-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            {isPasswordVisible ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        </div>
        {state.error && (
          <p
            id="login-error"
            role="alert"
            className="flex items-start gap-1.5 text-sm text-danger"
          >
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-medium text-accent-ink shadow-sm transition-all duration-200 ease-in-out hover:brightness-110 focus-visible:ring-4 focus-visible:ring-accent/30 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending && (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        )}
        {isPending ? "Giriş yapılıyor" : "Giriş yap"}
      </button>
    </form>
  );
}
