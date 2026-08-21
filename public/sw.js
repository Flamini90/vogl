const CACHE_NAME = "vogl-reminders"
const PAYLOAD_URL = "/vogl-reminder-payload"

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", () => {
  // Do not call clients.claim() — it aborts an in-flight first visit.
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client)
      if (existing) {
        existing.navigate(url)
        return existing.focus()
      }

      return self.clients.openWindow(url)
    }),
  )
})

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "vogl-reminders") {
    return
  }

  event.waitUntil(notifyFromCache())
})

async function notifyFromCache() {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(PAYLOAD_URL)
  if (!cached) {
    return
  }

  const payload = await cached.json()
  const items = Array.isArray(payload.payloads) ? payload.payloads : []

  await Promise.all(
    items.slice(0, 3).map((item) =>
      self.registration.showNotification(item.title, {
        body: item.body,
        tag: item.tag,
        data: { url: item.url },
        icon: "/icon",
        badge: "/icon",
      }),
    ),
  )
}
