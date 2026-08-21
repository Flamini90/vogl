"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bluetooth, Keyboard, LoaderCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { garageRepository } from "@/lib/db/garage-repository"
import { FUEL_TYPES, type CreateVehicleInput, type FuelType, type IdentitySource } from "@/lib/domain/types"
import { FUEL_LABELS } from "@/lib/domain/labels"
import { lookupPlateClient, lookupVinClient } from "@/lib/lookup/client"
import { normalizePlate } from "@/lib/domain/plate"
import type { ObdReading } from "@/lib/obd/types"
import { Field, NativeSelect } from "@/components/field"
import { ObdSheet } from "@/components/obd/obd-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LicensePlate } from "@/components/vehicles/license-plate"

const STEPS = ["targa", "identità", "chilometri", "documenti"] as const
type Step = (typeof STEPS)[number]

const EMPTY_DRAFT: CreateVehicleInput = {
  plate: "",
  vin: "",
  nickname: "",
  make: "",
  model: "",
  year: null,
  fuel: "petrol",
  odometerKm: 0,
  identitySource: "manual",
  documents: {},
}

export function AddVehicleFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("targa")
  const [draft, setDraft] = useState<CreateVehicleInput>(EMPTY_DRAFT)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [obdOpen, setObdOpen] = useState(false)

  const stepIndex = STEPS.indexOf(step)

  function patch(update: Partial<CreateVehicleInput>) {
    setDraft((current) => ({ ...current, ...update }))
  }

  async function searchPlate(event: React.FormEvent) {
    event.preventDefault()
    const plate = normalizePlate(draft.plate)
    if (plate.length < 5) {
      toast.error("Inserisci una targa valida.")
      return
    }

    setBusy(true)
    patch({ plate })
    const result = await lookupPlateClient(plate)
    setBusy(false)

    if (result.ok) {
      patch({
        plate,
        make: result.identity.make,
        model: result.identity.model,
        year: result.identity.year ?? null,
        fuel: result.identity.fuel ?? draft.fuel,
        vin: result.identity.vin ?? draft.vin,
        identitySource: "plate",
        registrationDate: result.identity.registrationDate ?? null,
      })
      setLookupMessage("Anagrafica recuperata dalla targa. Controlla i dati e continua.")
    } else {
      setLookupMessage(result.message)
      patch({ plate, identitySource: "manual" })
    }

    setStep("identità")
  }

  async function searchVin() {
    if (!draft.vin) {
      toast.error("Inserisci il VIN oppure connetti l'OBD.")
      return
    }

    setBusy(true)
    const result = await lookupVinClient(draft.vin)
    setBusy(false)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    patch({
      make: result.identity.make,
      model: result.identity.model,
      year: result.identity.year ?? draft.year,
      fuel: result.identity.fuel ?? draft.fuel,
      vin: result.identity.vin ?? draft.vin,
      identitySource: draft.identitySource === "manual" ? "obd" : draft.identitySource,
    })
    toast.success("VIN decodificato.")
  }

  function applyObd(reading: ObdReading, source: IdentitySource = "obd") {
    patch({
      vin: reading.vin ?? draft.vin,
      odometerKm: reading.odometerKm ?? draft.odometerKm,
      identitySource: source,
    })

    if (reading.vin && (!draft.make || !draft.model)) {
      void lookupVinClient(reading.vin).then((result) => {
        if (result.ok) {
          patch({
            make: result.identity.make,
            model: result.identity.model,
            year: result.identity.year ?? null,
            fuel: result.identity.fuel ?? draft.fuel,
            vin: result.identity.vin ?? reading.vin,
          })
        }
      })
    }
  }

  async function save() {
    if (!draft.make || !draft.model) {
      toast.error("Marca e modello sono obbligatori.")
      setStep("identità")
      return
    }

    setBusy(true)
    try {
      const vehicle = await garageRepository.createVehicle(draft)
      toast.success("Veicolo aggiunto al garage")
      router.push(`/vehicles/${vehicle.id}`)
    } catch {
      toast.error("Impossibile salvare il veicolo.")
    } finally {
      setBusy(false)
    }
  }

  const progressLabel = useMemo(
    () => `Passo ${stepIndex + 1} di ${STEPS.length}`,
    [stepIndex],
  )

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">{progressLabel}</p>
      <LicensePlate plate={draft.plate} size="lg" className="mx-auto" />

      {step === "targa" ? (
        <form className="space-y-5" onSubmit={(event) => void searchPlate(event)}>
          <Field label="Targa" htmlFor="plate" hint="Formato italiano, spazi facoltativi.">
            <Input
              id="plate"
              value={draft.plate}
              autoCapitalize="characters"
              autoComplete="off"
              className="h-12 text-center font-heading text-xl tracking-[0.2em] uppercase"
              onChange={(event) => patch({ plate: event.target.value.toUpperCase() })}
            />
          </Field>
          <Button className="h-12 w-full" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Search />}
            Cerca anagrafica
          </Button>
        </form>
      ) : null}

      {step === "identità" ? (
        <div className="space-y-5">
          {lookupMessage ? (
            <p className="text-muted-foreground text-sm leading-6">{lookupMessage}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-11" onClick={() => setObdOpen(true)}>
              <Bluetooth />
              OBD
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={() => void searchVin()}>
              <Keyboard />
              Decodifica VIN
            </Button>
          </div>
          <Field label="Marca" htmlFor="make">
            <Input id="make" className="h-11" value={draft.make} onChange={(event) => patch({ make: event.target.value })} />
          </Field>
          <Field label="Modello" htmlFor="model">
            <Input id="model" className="h-11" value={draft.model} onChange={(event) => patch({ model: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Anno" htmlFor="year">
              <Input
                id="year"
                className="h-11"
                inputMode="numeric"
                value={draft.year ?? ""}
                onChange={(event) =>
                  patch({ year: event.target.value ? Number.parseInt(event.target.value, 10) : null })
                }
              />
            </Field>
            <Field label="Alimentazione" htmlFor="fuel">
              <NativeSelect
                id="fuel"
                value={draft.fuel}
                onChange={(event) => patch({ fuel: event.target.value as FuelType })}
              >
                {FUEL_TYPES.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {FUEL_LABELS[fuel]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label="VIN" htmlFor="vin" hint="Se non arriva dalla targa, lo scanner OBD di solito lo legge.">
            <Input
              id="vin"
              className="h-11 uppercase"
              value={draft.vin ?? ""}
              onChange={(event) => patch({ vin: event.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Soprannome" htmlFor="nickname">
            <Input
              id="nickname"
              className="h-11"
              placeholder="Es. auto di casa"
              value={draft.nickname ?? ""}
              onChange={(event) => patch({ nickname: event.target.value })}
            />
          </Field>
          <Button className="h-12 w-full" onClick={() => setStep("chilometri")}>
            Continua
          </Button>
        </div>
      ) : null}

      {step === "chilometri" ? (
        <div className="space-y-5">
          <p className="text-muted-foreground text-sm leading-6">
            I chilometri arrivano dallo scanner OBD se la centralina li espone. In alternativa
            inseriscili tu: servono per i cicli di tagliando.
          </p>
          <Field label="Chilometri attuali" htmlFor="km">
            <Input
              id="km"
              className="h-12 font-heading text-2xl"
              inputMode="numeric"
              value={draft.odometerKm || ""}
              onChange={(event) => patch({ odometerKm: Number.parseInt(event.target.value || "0", 10) })}
            />
          </Field>
          <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setObdOpen(true)}>
            <Bluetooth />
            Leggi chilometri da OBD
          </Button>
          <Button className="h-12 w-full" onClick={() => setStep("documenti")}>
            Continua
          </Button>
        </div>
      ) : null}

      {step === "documenti" ? (
        <div className="space-y-5">
          <p className="text-muted-foreground text-sm leading-6">
            Bollo, assicurazione e revisione generano notifiche di rinnovo. Puoi completarle dopo.
          </p>
          <Field label="Scadenza bollo" htmlFor="bollo">
            <Input
              id="bollo"
              type="date"
              className="h-11"
              value={draft.documents.bolloDueAt ?? ""}
              onChange={(event) =>
                patch({ documents: { ...draft.documents, bolloDueAt: event.target.value || null } })
              }
            />
          </Field>
          <Field label="Scadenza assicurazione" htmlFor="insurance">
            <Input
              id="insurance"
              type="date"
              className="h-11"
              value={draft.documents.insuranceDueAt ?? ""}
              onChange={(event) =>
                patch({ documents: { ...draft.documents, insuranceDueAt: event.target.value || null } })
              }
            />
          </Field>
          <Field label="Scadenza revisione" htmlFor="inspection">
            <Input
              id="inspection"
              type="date"
              className="h-11"
              value={draft.documents.inspectionDueAt ?? ""}
              onChange={(event) =>
                patch({ documents: { ...draft.documents, inspectionDueAt: event.target.value || null } })
              }
            />
          </Field>
          <Button className="h-12 w-full" disabled={busy} onClick={() => void save()}>
            {busy ? <LoaderCircle className="animate-spin" /> : null}
            Crea piano di manutenzione
          </Button>
        </div>
      ) : null}

      {step !== "targa" ? (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)])}
        >
          Indietro
        </Button>
      ) : null}

      <ObdSheet
        open={obdOpen}
        onOpenChange={setObdOpen}
        onReading={(reading) => applyObd(reading)}
      />
    </div>
  )
}
