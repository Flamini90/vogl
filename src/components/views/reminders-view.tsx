"use client"

import Link from "next/link"
import { formatDueSummary, projectDue } from "@/lib/domain/due"
import { useGarageData, vehicleTitle } from "@/hooks/use-garage"
import { PageHeader } from "@/components/layout/page-header"
import { StatusBadge } from "@/components/maintenance/status-badge"
import { Skeleton } from "@/components/ui/skeleton"

export function RemindersView() {
  const { vehicles, operations, ready } = useGarageData()
  const byVehicle = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]))

  const items = operations
    .map((operation) => {
      const vehicle = byVehicle.get(operation.vehicleId)
      if (!vehicle) {
        return null
      }

      return { vehicle, projection: projectDue(operation, vehicle) }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((item) => item.projection.status !== "ok")
    .sort((left, right) => {
      const rank = { overdue: 0, due: 1, soon: 2, unset: 3, ok: 4 }
      return rank[left.projection.status] - rank[right.projection.status]
    })

  return (
    <div>
      <PageHeader
        eyebrow="Avvisi"
        title="Scadenze"
        description="Bollo, assicurazione, revisione e ogni tagliando, su tutti i veicoli."
      />

      {!ready ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm leading-6">
          Nessuna scadenza in evidenza. Quando un rinnovo si avvicina, comparirà qui e arriverà
          come notifica.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map(({ vehicle, projection }) => (
            <Link
              key={projection.operation.id}
              href={`/vehicles/${vehicle.id}`}
              className="block rounded-2xl bg-card/70 p-4 ring-1 ring-white/8"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{projection.operation.name}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {vehicleTitle(vehicle)} · {vehicle.plate}
                  </p>
                </div>
                <StatusBadge status={projection.status} />
              </div>
              <p className="mt-3 text-sm">{formatDueSummary(projection)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
