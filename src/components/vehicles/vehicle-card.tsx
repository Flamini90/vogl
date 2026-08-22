import Link from "next/link"
import { formatEur, formatKm } from "@/lib/domain/dates"
import { formatDueSummary, nextProjection, vehicleHealth, type DueProjection } from "@/lib/domain/due"
import { averagePer100, formatPer100, quantityUnitForFuel, spendInYear } from "@/lib/domain/journal"
import { FUEL_LABELS } from "@/lib/domain/labels"
import type { JournalEntry, Vehicle } from "@/lib/domain/types"
import { vehicleTitle } from "@/hooks/use-garage"
import { StatusBadge } from "@/components/maintenance/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { LicensePlate } from "@/components/vehicles/license-plate"

export function VehicleCard({
  vehicle,
  projections,
  journal = [],
}: {
  vehicle: Vehicle
  projections: DueProjection[]
  journal?: JournalEntry[]
}) {
  const next = nextProjection(projections)
  const health = vehicleHealth(projections)
  const unit = quantityUnitForFuel(vehicle.fuel)
  const per100 = averagePer100(journal)
  const yearSpend = spendInYear(journal)

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="block">
      <Card className="border-0 bg-card/80 ring-white/8 transition-transform active:scale-[0.99]">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-xl">{vehicleTitle(vehicle)}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {vehicle.year ? `${vehicle.year} · ` : ""}
                {FUEL_LABELS[vehicle.fuel]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">Salute</p>
              <p className="font-heading text-2xl">{health}</p>
            </div>
          </div>
          <LicensePlate plate={vehicle.plate} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{formatKm(vehicle.odometerKm)}</p>
            {next ? (
              <div className="flex items-center gap-2">
                <StatusBadge status={next.status} />
                <span className="text-muted-foreground max-w-[10rem] truncate text-xs">
                  {next.operation.name}
                </span>
              </div>
            ) : null}
          </div>
          {yearSpend > 0 || per100 !== null ? (
            <p className="text-muted-foreground text-xs">
              {[
                yearSpend > 0 ? `${formatEur(yearSpend)} quest'anno` : null,
                per100 !== null ? formatPer100(per100, unit) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {next ? (
            <p className="text-muted-foreground text-xs">{formatDueSummary(next)}</p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}
