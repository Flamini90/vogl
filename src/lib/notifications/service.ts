import { garageRepository } from "@/lib/db/garage-repository"
import { nowIso } from "@/lib/domain/dates"
import { remindersFromGarage, type ReminderPayload } from "@/lib/notifications/reminders"

const CACHE_NAME = "vogl-reminders"
const PAYLOAD_URL = "/vogl-reminder-payload"

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  return navigator.serviceWorker.register("/sw.js")
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("Questo browser non supporta le notifiche.")
  }

  if (Notification.permission === "granted") {
    return "granted"
  }

  return Notification.requestPermission()
}

export async function syncReminderPayload(payloads: ReminderPayload[]): Promise<void> {
  if (!("caches" in window)) {
    return
  }

  const cache = await caches.open(CACHE_NAME)
  await cache.put(
    PAYLOAD_URL,
    new Response(JSON.stringify({ generatedAt: nowIso(), payloads }), {
      headers: { "Content-Type": "application/json" },
    }),
  )
}

export async function dispatchReminders(payloads: ReminderPayload[]): Promise<number> {
  if (payloads.length === 0) {
    await syncReminderPayload([])
    return 0
  }

  await syncReminderPayload(payloads)

  const logs = await garageRepository.listNotificationLogs()
  const sent = new Set(logs.map((item) => item.fingerprint))
  const fresh = payloads.filter((item) => !sent.has(item.fingerprint))

  if (fresh.length === 0 || Notification.permission !== "granted") {
    return 0
  }

  const registration = await navigator.serviceWorker.getRegistration()

  for (const reminder of fresh) {
    if (registration) {
      await registration.showNotification(reminder.title, {
        body: reminder.body,
        tag: reminder.tag,
        data: { url: reminder.url },
        icon: "/icon",
        badge: "/icon",
      })
    } else {
      new Notification(reminder.title, { body: reminder.body })
    }

    await garageRepository.logNotification({
      operationId: reminder.operationId,
      vehicleId: reminder.vehicleId,
      fingerprint: reminder.fingerprint,
      sentAt: nowIso(),
    })
  }

  return fresh.length
}

export async function evaluateAndNotify(): Promise<number> {
  const settings = await garageRepository.getSettings()
  if (!settings.notificationsEnabled) {
    await syncReminderPayload([])
    return 0
  }

  const [vehicles, operations] = await Promise.all([
    garageRepository.listVehicles(),
    garageRepository.listAllOperations(),
  ])

  const payloads = remindersFromGarage(vehicles, operations, settings)
  return dispatchReminders(payloads)
}

export async function enablePeriodicSync(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const periodic = (
    registration as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> }
    }
  ).periodicSync

  if (!periodic) {
    return
  }

  await periodic.register("vogl-reminders", { minInterval: 60 * 60 * 1000 })
}
