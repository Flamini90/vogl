"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { projectVehicleOperations } from "@/lib/domain/due"
import { BRAND } from "@/lib/brand"
import { useGarageData } from "@/hooks/use-garage"
import { Logo } from "@/components/brand/logo"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleCard } from "@/components/vehicles/vehicle-card"

export function GarageView() {
  const { vehicles, operations, ready } = useGarageData()

  return (
    <div>
      <PageHeader
        eyebrow={BRAND.acronym}
        title="Garage"
        description={BRAND.tagline}
        action={
          <Button render={<Link href="/vehicles/new" />} size="icon-lg">
            <Plus />
          </Button>
        }
      />

      {!ready ? (
        <div className="space-y-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyGarage />
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              projections={projectVehicleOperations(
                vehicle,
                operations.filter((item) => item.vehicleId === vehicle.id),
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyGarage() {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-card/60 px-6 py-12 text-center ring-1 ring-white/8">
      <Logo />
      <p className="mt-6 max-w-xs text-sm leading-6">
        Aggiungi il primo veicolo dalla targa. Se l&apos;anagrafe non risponde, VOGL usa lo scanner
        OBD oppure l&apos;inserimento manuale.
      </p>
      <Button render={<Link href="/vehicles/new" />} className="mt-6 h-12 px-6">
        Aggiungi dalla targa
      </Button>
    </div>
  )
}
