"use client"

import { usePathname } from "next/navigation"
import { BottomNav } from "@/components/layout/bottom-nav"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(232,184,109,0.16),transparent_58%)]" />
      <main className="relative flex flex-1 flex-col px-4 pt-6 pb-28">{children}</main>
      <BottomNav pathname={pathname} />
    </div>
  )
}
