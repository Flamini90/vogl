"use client"

import { useEffect } from "react"
import { garageRepository } from "@/lib/db/garage-repository"
import { evaluateAndNotify, registerServiceWorker } from "@/lib/notifications/service"

async function clearStaleWorkers() {
  if (!("serviceWorker" in navigator)) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}

export function NotificationBootstrap() {
  useEffect(() => {
    let cancelled = false

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const settings = await garageRepository.getSettings()
          if (cancelled) {
            return
          }

          if (settings.notificationsEnabled) {
            await registerServiceWorker()
          } else {
            await clearStaleWorkers()
          }

          await evaluateAndNotify()
        } catch {
          await clearStaleWorkers().catch(() => undefined)
        }
      })()
    }, 2500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  return null
}
