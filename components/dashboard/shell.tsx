"use client";

import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:pl-64">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-h-dvh flex-col">
        <Header onOpenMenu={() => setIsSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <Toaster
        position="top-center"
        theme="system"
        closeButton
        toastOptions={{
          classNames: {
            toast: "!rounded-xl !border-line !bg-surface !text-ink !shadow-float",
            description: "!text-ink-soft",
          },
        }}
      />
    </div>
  );
}
