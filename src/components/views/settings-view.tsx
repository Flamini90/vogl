"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { BRAND } from "@/lib/brand"
import { garageRepository } from "@/lib/db/garage-repository"
import type { GarageSnapshot } from "@/lib/domain/types"
import {
  enablePeriodicSync,
  evaluateAndNotify,
  requestNotificationPermission,
} from "@/lib/notifications/service"
import { useGarageData } from "@/hooks/use-garage"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export function SettingsView() {
  const { settings, ready } = useGarageData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function toggleNotifications(enabled: boolean) {
    if (!enabled) {
      await garageRepository.saveSettings({ notificationsEnabled: false })
      toast.message("Notifiche disattivate")
      return
    }

    try {
      const permission = await requestNotificationPermission()
      if (permission !== "granted") {
        toast.error("Permesso notifiche negato.")
        return
      }

      await garageRepository.saveSettings({ notificationsEnabled: true })
      await enablePeriodicSync().catch(() => undefined)
      await evaluateAndNotify()
      toast.success("Notifiche attive. VOGL avvisa bollo, assicurazione e tagliandi.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notifiche non disponibili.")
    }
  }

  async function exportGarage() {
    const snapshot = await garageRepository.exportSnapshot()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "vogl-garage.json"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importGarage(file: File) {
    setBusy(true)
    try {
      const snapshot = JSON.parse(await file.text()) as GarageSnapshot
      if (!Array.isArray(snapshot.vehicles) || !Array.isArray(snapshot.operations)) {
        throw new Error("File non valido")
      }
      await garageRepository.importSnapshot(snapshot)
      toast.success("Garage ripristinato")
    } catch {
      toast.error("Impossibile importare il backup.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={BRAND.name}
        title="Impostazioni"
        description="Tutto resta sul dispositivo: zero account, zero abbonamenti."
      />

      <section className="rounded-3xl bg-card/70 p-5 ring-1 ring-white/8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Notifiche push</p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Avvisi per scadenze e rinnovi. Funzionano meglio se installi VOGL come app.
            </p>
          </div>
          <Switch
            checked={Boolean(settings?.notificationsEnabled)}
            disabled={!ready}
            onCheckedChange={(checked) => void toggleNotifications(checked)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg">Backup locale</h2>
        <Button variant="outline" className="h-11 w-full" onClick={() => void exportGarage()}>
          Esporta garage
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Importa backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void importGarage(file)
            }
          }}
        />
      </section>

      <section className="text-muted-foreground space-y-2 text-sm leading-6">
        <p>
          <span className="text-foreground font-medium">{BRAND.name}</span> sta per{" "}
          {BRAND.acronym}.
        </p>
        <p>
          La ricerca targa è gratuita se non configuri API a pagamento. In alternativa il VIN
          viene decodificato con NHTSA, servizio gratuito.
        </p>
      </section>
    </div>
  )
}
