"use client"

import { useCallback, useEffect, useState } from "react"
import { LoaderCircle, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { garageRepository } from "@/lib/db/garage-repository"
import { addMonths, formatDateIt, formatKm } from "@/lib/domain/dates"
import type { PortalRevision, PortalRevisionResult, PortalVehicleType } from "@/lib/lookup/portal"
import type { Vehicle } from "@/lib/domain/types"
import { Field, NativeSelect } from "@/components/field"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const TYPE_OPTIONS: Array<{ value: PortalVehicleType; label: string }> = [
  { value: "A", label: "Autoveicolo" },
  { value: "M", label: "Motoveicolo" },
  { value: "C", label: "Ciclomotore" },
  { value: "R", label: "Rimorchio" },
]

const OUTCOME_LABELS: Record<PortalRevision["outcome"], string> = {
  P: "Regolare",
  S: "Sospesa",
  R: "Da ripetere",
}

type CaptchaState = { id: string; imageBase64: string }

export function RevisioniSheet({
  vehicle,
  open,
  onClose,
}: {
  vehicle: Vehicle
  open: boolean
  onClose: () => void
}) {
  const [captcha, setCaptcha] = useState<CaptchaState | null>(null)
  const [captchaText, setCaptchaText] = useState("")
  const [type, setType] = useState<PortalVehicleType>("A")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Extract<PortalRevisionResult, { ok: true }> | null>(null)

  const loadCaptcha = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/captcha")
      const payload = (await response.json()) as CaptchaState | { ok: false }
      if ("id" in payload && "imageBase64" in payload) {
        setCaptcha(payload)
        return
      }
      toast.error("Il Portale non ha generato il captcha.")
    } catch {
      toast.error("Impossibile contattare il Portale.")
    }
  }, [])

  const resetSheet = useCallback(() => {
    setCaptcha(null)
    setCaptchaText("")
    setResult(null)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const timer = window.setTimeout(() => void loadCaptcha(), 0)
    return () => window.clearTimeout(timer)
  }, [loadCaptcha, open])

  async function search() {
    if (!captcha || !captchaText.trim()) {
      toast.error("Inserisci il codice dell'immagine.")
      return
    }

    setBusy(true)
    try {
      const response = await fetch("/api/portal/revisioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: vehicle.plate, type, captchaId: captcha.id, captchaText: captchaText.trim() }),
      })
      const payload = (await response.json()) as PortalRevisionResult

      if (!payload.ok) {
        toast.error(payload.message)
        setCaptchaText("")
        await loadCaptcha()
        return
      }

      setResult(payload)
      toast.success(`${payload.revisions.length} revisioni trovate sul Portale.`)
    } catch {
      toast.error("Impossibile interrogare il Portale.")
    } finally {
      setBusy(false)
    }
  }

  async function sync() {
    if (!result) {
      return
    }

    const inspection = await garageRepository.listOperations(vehicle.id)
    const inspectionOp = inspection.find((item) => item.catalogKey === "inspection")
    const usable = result.revisions.filter((item) => item.outcome === "P" && !item.cancelled)
    const latest = usable[0] ?? result.revisions[0]

    if (inspectionOp) {
      await garageRepository.updateOperation(inspectionOp.id, {
        lastServiceAt: latest.date,
        lastServiceKm: latest.km ?? vehicle.odometerKm,
        dueAt: latest.outcome === "P" ? addMonths(latest.date, 24) : latest.date,
      })
    }

    for (const revision of [...result.revisions].reverse()) {
      const alreadyThere = (await garageRepository.listJournal(vehicle.id)).some(
        (item) => item.kind === "service" && item.at === revision.date && item.km === (revision.km ?? item.km) && item.title === "Revisione",
      )
      if (alreadyThere) {
        continue
      }

      await garageRepository.addJournalEntry({
        vehicleId: vehicle.id,
        kind: "service",
        at: revision.date,
        km: revision.km ?? vehicle.odometerKm,
        title: "Revisione",
        notes: `${OUTCOME_LABELS[revision.outcome]} · Portale dell'Automobilista`,
      })
    }

    if (latest.km !== null && latest.km > vehicle.odometerKm) {
      await garageRepository.recordOdometer(vehicle.id, latest.km, "manual")
      toast.success(`Chilometri aggiornati a ${formatKm(latest.km)}`)
    }

    toast.success("Revisione e diario sincronizzati dal Portale.")
    onClose()
  }

  const nextDue = result
    ? (() => {
        const usable = result.revisions.filter((item) => item.outcome === "P" && !item.cancelled)
        const latest = usable[0] ?? result.revisions[0]
        return latest.outcome === "P" ? addMonths(latest.date, 24) : latest.date
      })()
    : null

  return (
    <Sheet open={open} onOpenChange={(value) => !value && (resetSheet(), onClose())}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle>Revisioni dal Portale</SheetTitle>
          <SheetDescription>
            VOGL interroga il Portale dell&apos;Automobilista per {vehicle.plate}. Il captcha va
            letto da te: gli altri passaggi sono automatici.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <Field label="Tipo veicolo" htmlFor="portal-type">
            <NativeSelect id="portal-type" value={type} onChange={(event) => setType(event.target.value as PortalVehicleType)}>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <div className="flex items-center gap-3">
            <div className="flex-1 overflow-hidden rounded-lg border border-neutral-300 bg-[#f4f1ea]">
              {captcha ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${captcha.imageBase64}`}
                  alt="Codice captcha del Portale"
                  className="h-14 w-full object-contain"
                />
              ) : (
                <div className="text-muted-foreground flex h-14 items-center justify-center text-xs">
                  Caricamento captcha...
                </div>
              )}
            </div>
            <Button variant="outline" size="icon-lg" onClick={() => { setCaptcha(null); void loadCaptcha() }} aria-label="Nuovo captcha">
              <RefreshCcw />
            </Button>
          </div>

          <Field label="Codice dell'immagine" htmlFor="portal-captcha">
            <input
              id="portal-captcha"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full rounded-lg border bg-transparent px-3 uppercase outline-none focus-visible:ring-3"
              value={captchaText}
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(event) => setCaptchaText(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void search()
                }
              }}
            />
          </Field>

          {!result ? (
            <Button className="h-11 w-full" disabled={busy || !captcha} onClick={() => void search()}>
              {busy ? <LoaderCircle className="animate-spin" /> : null}
              Cerca revisioni
            </Button>
          ) : null}
        </div>

        {result ? (
          <div className="space-y-4 px-4 pt-4">
            <div className="space-y-2">
              {result.revisions.map((revision) => (
                <div key={`${revision.date}-${revision.km}`} className="flex items-center justify-between gap-3 rounded-2xl bg-card/70 p-3 text-sm ring-1 ring-white/8">
                  <div>
                    <p className="font-medium">{formatDateIt(revision.date)}</p>
                    <p className="text-muted-foreground text-xs">
                      {OUTCOME_LABELS[revision.outcome]}
                      {revision.cancelled ? " · annullata" : ""}
                    </p>
                  </div>
                  <p className="text-right text-sm">{revision.km !== null ? formatKm(revision.km) : "—"}</p>
                </div>
              ))}
            </div>
            {nextDue ? (
              <p className="text-muted-foreground text-sm leading-6">
                Prossima revisione prevista: {formatDateIt(nextDue)}.
              </p>
            ) : null}
            <Button className="h-11 w-full" onClick={() => void sync()}>
              Aggiorna revisione e diario
            </Button>
          </div>
        ) : null}

        <SheetFooter>
          <Button variant="ghost" className="w-full" onClick={() => (resetSheet(), onClose())}>
            Chiudi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}