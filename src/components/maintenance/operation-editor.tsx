"use client"

import { garageRepository } from "@/lib/db/garage-repository"
import type { MaintenanceOperation } from "@/lib/domain/types"
import { Field } from "@/components/field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

export function OperationEditor({
  operation,
  onClose,
}: {
  operation: MaintenanceOperation | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(operation)} onOpenChange={(open) => !open && onClose()}>
      {operation ? (
        <OperationForm key={operation.id} operation={operation} onClose={onClose} />
      ) : null}
    </Dialog>
  )
}

function OperationForm({
  operation,
  onClose,
}: {
  operation: MaintenanceOperation
  onClose: () => void
}) {
  const [dueAt, setDueAt] = useState(operation.dueAt ?? "")
  const [intervalKm, setIntervalKm] = useState(operation.intervalKm?.toString() ?? "")
  const [intervalMonths, setIntervalMonths] = useState(operation.intervalMonths?.toString() ?? "")
  const [enabled, setEnabled] = useState(operation.enabled)

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{operation.name}</DialogTitle>
        <DialogDescription>Personalizza intervalli e avvisi di questa operazione.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Prossima scadenza" htmlFor="dueAt">
          <Input id="dueAt" type="date" className="h-11" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
        </Field>
        <Field label="Intervallo km" htmlFor="intervalKm">
          <Input
            id="intervalKm"
            className="h-11"
            inputMode="numeric"
            value={intervalKm}
            onChange={(event) => setIntervalKm(event.target.value)}
          />
        </Field>
        <Field label="Intervallo mesi" htmlFor="intervalMonths">
          <Input
            id="intervalMonths"
            className="h-11"
            inputMode="numeric"
            value={intervalMonths}
            onChange={(event) => setIntervalMonths(event.target.value)}
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">Operazione attiva</p>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>
      <DialogFooter>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            void garageRepository
              .updateOperation(operation.id, {
                dueAt: dueAt || null,
                intervalKm: intervalKm ? Number.parseInt(intervalKm, 10) : null,
                intervalMonths: intervalMonths ? Number.parseInt(intervalMonths, 10) : null,
                enabled,
              })
              .then(onClose)
          }}
        >
          Salva
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
