"use client"

import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { garageRepository } from "@/lib/db/garage-repository"
import { todayIso } from "@/lib/domain/dates"
import { parseAmount } from "@/lib/domain/journal"
import type { MaintenanceOperation, Vehicle } from "@/lib/domain/types"
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

export function CompleteOperationSheet({
  vehicle,
  operation,
  onClose,
}: {
  vehicle: Vehicle
  operation: MaintenanceOperation | null
  onClose: () => void
}) {
  return (
    <Sheet open={Boolean(operation)} onOpenChange={(open) => !open && onClose()}>
      {operation ? (
        <CompleteForm key={operation.id} vehicle={vehicle} operation={operation} onClose={onClose} />
      ) : null}
    </Sheet>
  )
}

function CompleteForm({
  vehicle,
  operation,
  onClose,
}: {
  vehicle: Vehicle
  operation: MaintenanceOperation
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [at, setAt] = useState(todayIso())
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState(operation.notes ?? "")

  async function save() {
    setBusy(true)
    try {
      await garageRepository.completeOperation(operation.id, vehicle, {
        at,
        amount: parseAmount(amount),
        notes,
      })
      toast.success(`${operation.name} registrato nel diario`)
      onClose()
    } catch {
      toast.error("Impossibile aggiornare l'operazione.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <SheetContent side="bottom" className="rounded-t-3xl pb-8">
      <SheetHeader>
        <SheetTitle>{operation.name}</SheetTitle>
        <SheetDescription>
          Segna l&apos;intervento fatto. La prossima scadenza si ricalcola da questa data, a {vehicle.odometerKm} km.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-4 px-4">
        <Field label="Data intervento" htmlFor="complete-at">
          <Input id="complete-at" type="date" className="h-11" value={at} onChange={(event) => setAt(event.target.value)} />
        </Field>
        <Field label="Costo €" htmlFor="complete-amount" hint="Facoltativo. Resta nel diario insieme allo storico.">
          <Input
            id="complete-amount"
            className="h-11"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Field label="Note" htmlFor="complete-notes">
          <Input
            id="complete-notes"
            className="h-11"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
      </div>
      <SheetFooter>
        <Button className="h-11 w-full" disabled={busy} onClick={() => void save()}>
          {busy ? <LoaderCircle className="animate-spin" /> : null}
          Segna come fatto
        </Button>
      </SheetFooter>
    </SheetContent>
  )
}
