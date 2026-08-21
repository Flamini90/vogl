"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { garageRepository } from "@/lib/db/garage-repository"
import { FUEL_TYPES, type FuelType, type Vehicle } from "@/lib/domain/types"
import { FUEL_LABELS } from "@/lib/domain/labels"
import { useVehicle } from "@/hooks/use-garage"
import { Field, NativeSelect } from "@/components/field"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"

export function VehicleEditView({ id }: { id: string }) {
  const vehicle = useVehicle(id)

  if (vehicle === undefined) {
    return <Skeleton className="h-80 rounded-3xl" />
  }

  if (!vehicle) {
    return <p>Veicolo non trovato.</p>
  }

  return <VehicleEditForm key={vehicle.id} vehicle={vehicle} />
}

function VehicleEditForm({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter()
  const [make, setMake] = useState(vehicle.make)
  const [model, setModel] = useState(vehicle.model)
  const [nickname, setNickname] = useState(vehicle.nickname ?? "")
  const [year, setYear] = useState(vehicle.year?.toString() ?? "")
  const [fuel, setFuel] = useState<FuelType>(vehicle.fuel)
  const [odometerKm, setOdometerKm] = useState(vehicle.odometerKm.toString())
  const [vin, setVin] = useState(vehicle.vin ?? "")

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        void garageRepository
          .updateVehicle(vehicle.id, {
            make,
            model,
            nickname,
            year: year ? Number.parseInt(year, 10) : null,
            fuel,
            vin,
          })
          .then(async () => {
            const km = Number.parseInt(odometerKm || "0", 10)
            if (km !== vehicle.odometerKm) {
              await garageRepository.recordOdometer(vehicle.id, km, "manual", vin)
            }
            toast.success("Veicolo aggiornato")
            router.push(`/vehicles/${vehicle.id}`)
          })
      }}
    >
      <PageHeader eyebrow={vehicle.plate} title="Modifica veicolo" />
      <Field label="Marca" htmlFor="make">
        <Input id="make" className="h-11" value={make} onChange={(event) => setMake(event.target.value)} />
      </Field>
      <Field label="Modello" htmlFor="model">
        <Input id="model" className="h-11" value={model} onChange={(event) => setModel(event.target.value)} />
      </Field>
      <Field label="Soprannome" htmlFor="nickname">
        <Input id="nickname" className="h-11" value={nickname} onChange={(event) => setNickname(event.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Anno" htmlFor="year">
          <Input id="year" className="h-11" value={year} onChange={(event) => setYear(event.target.value)} />
        </Field>
        <Field label="Alimentazione" htmlFor="fuel">
          <NativeSelect id="fuel" value={fuel} onChange={(event) => setFuel(event.target.value as FuelType)}>
            {FUEL_TYPES.map((item) => (
              <option key={item} value={item}>
                {FUEL_LABELS[item]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Chilometri" htmlFor="km">
        <Input id="km" className="h-11" inputMode="numeric" value={odometerKm} onChange={(event) => setOdometerKm(event.target.value)} />
      </Field>
      <Field label="VIN" htmlFor="vin">
        <Input id="vin" className="h-11 uppercase" value={vin} onChange={(event) => setVin(event.target.value.toUpperCase())} />
      </Field>
      <Button className="h-12 w-full">Salva</Button>
      <Button variant="ghost" className="w-full" render={<Link href={`/vehicles/${vehicle.id}`} />}>
        Annulla
      </Button>
    </form>
  )
}
