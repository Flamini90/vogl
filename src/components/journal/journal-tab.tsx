"use client"

import { Fuel, Gauge, Receipt } from "lucide-react"
import { toast } from "sonner"
import { garageRepository } from "@/lib/db/garage-repository"
import { formatDateIt, formatEur, formatKm } from "@/lib/domain/dates"
import {
  averagePer100,
  formatPer100,
  lastRefuel,
  quantityUnitForFuel,
  sortJournal,
  spendInYear,
} from "@/lib/domain/journal"
import { JOURNAL_LABELS } from "@/lib/domain/labels"
import type { JournalEntry, Vehicle } from "@/lib/domain/types"
import type { JournalComposerMode } from "@/components/journal/journal-composer"
import { Button } from "@/components/ui/button"

export function JournalTab({
  vehicle,
  entries,
  onCompose,
}: {
  vehicle: Vehicle
  entries: JournalEntry[]
  onCompose: (mode: JournalComposerMode) => void
}) {
  const unit = quantityUnitForFuel(vehicle.fuel)
  const per100 = averagePer100(entries)
  const yearSpend = spendInYear(entries)
  const latestFill = lastRefuel(entries)
  const items = sortJournal(entries)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label={unit === "kwh" ? "Consumo" : "Media"}
          value={per100 === null ? "—" : formatPer100(per100, unit)}
        />
        <Stat label="Spesa anno" value={yearSpend > 0 ? formatEur(yearSpend) : "—"} />
      </div>
      {latestFill ? (
        <p className="text-muted-foreground text-xs leading-5">
          Ultima {latestFill.unit === "kwh" ? "ricarica" : "rifornimento"} il {formatDateIt(latestFill.at)}
          {latestFill.quantity
            ? ` · ${latestFill.quantity.toString().replace(".", ",")} ${latestFill.unit === "kwh" ? "kWh" : "L"}`
            : ""}
          {latestFill.amount ? ` · ${formatEur(latestFill.amount)}` : ""}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs leading-5">
          Due pieni consecutivi bastano per calcolare il consumo. I dati restano nel browser.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="h-11" onClick={() => onCompose("odometer")}>
          <Gauge />
          Km
        </Button>
        <Button variant="outline" className="h-11" onClick={() => onCompose("refuel")}>
          <Fuel />
          {unit === "kwh" ? "kWh" : "Pieno"}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => onCompose("expense")}>
          <Receipt />
          Spesa
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm leading-6">
          Il diario è vuoto. Aggiungi un rifornimento o una spesa per seguire il ciclo di vita del veicolo.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((entry) => (
            <JournalRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/40 p-3">
      <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">{label}</p>
      <p className="font-heading mt-1 text-lg leading-tight">{value}</p>
    </div>
  )
}

function JournalRow({ entry }: { entry: JournalEntry }) {
  const details = [
    formatDateIt(entry.at),
    formatKm(entry.km),
    entry.quantity !== null
      ? `${entry.quantity.toString().replace(".", ",")} ${entry.unit === "kwh" ? "kWh" : "L"}`
      : null,
    entry.amount !== null ? formatEur(entry.amount) : null,
  ].filter(Boolean)

  return (
    <div className="rounded-2xl bg-card/70 p-4 ring-1 ring-white/8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{entry.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">{JOURNAL_LABELS[entry.kind]}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (window.confirm("Eliminare questa voce dal diario?")) {
              void garageRepository.deleteJournalEntry(entry.id).then(() => toast.message("Voce eliminata"))
            }
          }}
        >
          Elimina
        </Button>
      </div>
      <p className="mt-3 text-sm">{details.join(" · ")}</p>
      {entry.notes ? <p className="text-muted-foreground mt-2 text-xs leading-5">{entry.notes}</p> : null}
    </div>
  )
}
