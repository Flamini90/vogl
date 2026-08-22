"use client"

import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { garageRepository } from "@/lib/db/garage-repository"
import { todayIso } from "@/lib/domain/dates"
import { parseAmount, quantityUnitForFuel, refuelTitle } from "@/lib/domain/journal"
import { UNIT_LABELS } from "@/lib/domain/labels"
import type { JournalKind, Vehicle } from "@/lib/domain/types"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"

export type JournalComposerMode = Extract<JournalKind, "refuel" | "odometer" | "expense">

const COPY: Record<
  JournalComposerMode,
  { title: (vehicle: Vehicle) => string; description: string; action: string }
> = {
  refuel: {
    title: (vehicle) => refuelTitle(vehicle.fuel),
    description: "I km si aggiornano se superano il contachilometri attuale. Il pieno serve per il consumo medio.",
    action: "Salva",
  },
  odometer: {
    title: () => "Aggiorna chilometri",
    description: "Usa questa schermata quando non hai lo scanner OBD a portata di mano.",
    action: "Aggiorna km",
  },
  expense: {
    title: () => "Registra una spesa",
    description: "Pedaggio, parcheggio, accessori: resta sul dispositivo, senza cloud.",
    action: "Salva spesa",
  },
}

export function JournalComposer({
  vehicle,
  mode,
  onClose,
}: {
  vehicle: Vehicle
  mode: JournalComposerMode | null
  onClose: () => void
}) {
  return (
    <Sheet open={Boolean(mode)} onOpenChange={(open) => !open && onClose()}>
      {mode ? (
        <ComposerForm key={`${mode}-${vehicle.id}-${vehicle.odometerKm}`} vehicle={vehicle} mode={mode} onClose={onClose} />
      ) : null}
    </Sheet>
  )
}

function ComposerForm({
  vehicle,
  mode,
  onClose,
}: {
  vehicle: Vehicle
  mode: JournalComposerMode
  onClose: () => void
}) {
  const copy = COPY[mode]
  const unit = quantityUnitForFuel(vehicle.fuel)
  const [busy, setBusy] = useState(false)
  const [at, setAt] = useState(todayIso())
  const [km, setKm] = useState(String(vehicle.odometerKm))
  const [quantity, setQuantity] = useState("")
  const [amount, setAmount] = useState("")
  const [fullTank, setFullTank] = useState(true)
  const [title, setTitle] = useState(mode === "expense" ? "" : copy.title(vehicle))
  const [notes, setNotes] = useState("")

  async function save() {
    const parsedKm = Number.parseInt(km || "0", 10)
    if (!Number.isFinite(parsedKm) || parsedKm < 0) {
      toast.error("Inserisci i chilometri.")
      return
    }

    const parsedQuantity = parseAmount(quantity)
    const parsedAmount = parseAmount(amount)

    if (mode === "refuel" && (parsedQuantity === null || parsedQuantity <= 0)) {
      toast.error(`Inserisci i ${UNIT_LABELS[unit]}.`)
      return
    }

    if (mode === "expense") {
      if (!title.trim()) {
        toast.error("Dai un nome alla spesa.")
        return
      }
      if (parsedAmount === null || parsedAmount <= 0) {
        toast.error("Inserisci l'importo.")
        return
      }
    }

    setBusy(true)
    try {
      await garageRepository.addJournalEntry({
        vehicleId: vehicle.id,
        kind: mode,
        at,
        km: parsedKm,
        title: title.trim() || copy.title(vehicle),
        notes,
        quantity: mode === "refuel" ? parsedQuantity : null,
        unit: mode === "refuel" ? unit : null,
        amount: parsedAmount,
        fullTank: mode === "refuel" ? fullTank : false,
      })
      toast.success(mode === "odometer" ? "Chilometri aggiornati" : "Voce aggiunta al diario")
      onClose()
    } catch {
      toast.error("Impossibile salvare la voce.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <SheetContent side="bottom" className="rounded-t-3xl pb-8">
      <SheetHeader>
        <SheetTitle>{copy.title(vehicle)}</SheetTitle>
        <SheetDescription>{copy.description}</SheetDescription>
      </SheetHeader>
      <div className="space-y-4 px-4">
        {mode === "expense" ? (
          <Field label="Cosa hai pagato" htmlFor="journal-title">
            <Input
              id="journal-title"
              className="h-11"
              placeholder="Pedaggio, parcheggio, accessori..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data" htmlFor="journal-at">
            <Input id="journal-at" type="date" className="h-11" value={at} onChange={(event) => setAt(event.target.value)} />
          </Field>
          <Field label="Chilometri" htmlFor="journal-km">
            <Input
              id="journal-km"
              className="h-11"
              inputMode="numeric"
              value={km}
              onChange={(event) => setKm(event.target.value)}
            />
          </Field>
        </div>
        {mode === "refuel" ? (
          <>
            <Field label={unit === "kwh" ? "kWh" : "Litri"} htmlFor="journal-qty">
              <Input
                id="journal-qty"
                className="h-11"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-background/40 px-3 py-3">
              <div>
                <p className="text-sm font-medium">{unit === "kwh" ? "Ricarica completa" : "Pieno"}</p>
                <p className="text-muted-foreground text-xs">Serve per calcolare il consumo medio.</p>
              </div>
              <Switch checked={fullTank} onCheckedChange={setFullTank} />
            </div>
          </>
        ) : null}
        {mode !== "odometer" ? (
          <Field label="Importo €" htmlFor="journal-amount" hint={mode === "refuel" ? "Facoltativo, ma utile per il costo al km." : undefined}>
            <Input
              id="journal-amount"
              className="h-11"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
        ) : null}
        <Field label="Note" htmlFor="journal-notes">
          <Input
            id="journal-notes"
            className="h-11"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
      </div>
      <SheetFooter>
        <Button className="h-11 w-full" disabled={busy} onClick={() => void save()}>
          {busy ? <LoaderCircle className="animate-spin" /> : null}
          {copy.action}
        </Button>
      </SheetFooter>
    </SheetContent>
  )
}
