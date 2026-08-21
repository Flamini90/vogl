"use client"

import { useEffect } from "react"
import { garageRepository } from "@/lib/db/garage-repository"
import { evaluateAndNotify, registerServiceWorker } from "@/lib/notifications/service"

export function NotificationBootstrap() {
  useEffect(() => {
    let cancelled = false

    async function boot() {
      const settings = await garageRepository.getSettings().catch(() => null)
      if (cancelled) {
        return
      }

      if (settings?.notificationsEnabled) {
        await registerServiceWorker()
      }

      await evaluateAndNotify().catch(() => undefined)
    }

    const start = () => {
      window.setTimeout(() => {
        if (!cancelled) {
          void boot()
        }
      }, 0)
    }

    if (document.readyState === "complete") {
      start()
    } else {
      window.addEventListener("load", start, { once: true })
    }

    const onFocus = () => {
      void evaluateAndNotify().catch(() => undefined)
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)

    return () => {
      cancelled = true
      window.removeEventListener("load", start)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [])

  return null
}
