"use client"

import { useEffect } from "react"
import { evaluateAndNotify, registerServiceWorker } from "@/lib/notifications/service"

export function NotificationBootstrap() {
  useEffect(() => {
    let cancelled = false

    async function boot() {
      await registerServiceWorker()
      if (!cancelled) {
        await evaluateAndNotify().catch(() => undefined)
      }
    }

    void boot()

    const onFocus = () => {
      void evaluateAndNotify().catch(() => undefined)
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)

    return () => {
      cancelled = true
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [])

  return null
}
