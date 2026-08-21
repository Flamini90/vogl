"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bluetooth, Pencil } from "lucide-react"
import { toast } from "sonner"
import { garageRepository } from "@/lib/db/garage-repository"
import { formatKm } from "@/lib/domain/dates"
import { projectVehicleOperations, vehicleHealth } from "@/lib/domain/due"
import { FUEL_LABELS, SOURCE_LABELS } from "@/lib/domain/labels"
import { useOperations, useVehicle, vehicleTitle } from "@/hooks/use-garage"
import { PageHeader } from "@/components/layout/page-header"
import { OperationRow } from "@/components/maintenance/operation-row"
import { ObdSheet } from "@/components/obd/obd-sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LicensePlate } from "@/components/vehicles/license-plate"
import { OperationEditor } from "@/components/maintenance/operation-editor"

export function VehicleView({ id }: { id: string }) {
  const router = useRouter()
  const vehicle = useVehicle(id)
  const operations = useOperations(id)
  const [obdOpen, setObdOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const projections = useMemo(
    () => (vehicle && operations ? projectVehicleOperations(vehicle, operations) : []),
    [vehicle, operations],
  )

  if (vehicle === undefined) {
    return <Skeleton className="h-80 rounded-3xl" />
  }

  if (!vehicle) {
    return (
      <div className="space-y-4">
        <p>Veicolo non trovato.</p>
        <Button render={<Link href="/" />}>Torna al garage</Button>
      </div>
    )
  }

  const grouped = {
    document: projections.filter((item) => item.operation.category === "document"),
    ordinary: projections.filter((item) => item.operation.category === "ordinary"),
    wear: projections.filter((item) => item.operation.category === "wear"),
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={SOURCE_LABELS[vehicle.identitySource]}
        title={vehicleTitle(vehicle)}
        description={`${vehicle.year ? `${vehicle.year} · ` : ""}${FUEL_LABELS[vehicle.fuel]}`}
        action={
          <Button variant="ghost" size="icon-lg" render={<Link href="/" />}>
            <ArrowLeft />
          </Button>
        }
      />

      <div className="flex flex-col items-center gap-4 rounded-3xl bg-card/70 p-5 ring-1 ring-white/8">
        <LicensePlate plate={vehicle.plate} size="lg" />
        <div className="grid w-full grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-background/40 p-3">
            <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">Km</p>
            <p className="font-heading mt-1 text-2xl">{formatKm(vehicle.odometerKm)}</p>
          </div>
          <div className="rounded-2xl bg-background/40 p-3">
            <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">Salute</p>
            <p className="font-heading mt-1 text-2xl">{vehicleHealth(projections)}</p>
          </div>
        </div>
        <div className="flex w-full gap-2">
          <Button className="h-11 flex-1" onClick={() => setObdOpen(true)}>
            <Bluetooth />
            Aggiorna da OBD
          </Button>
          <Button variant="outline" size="icon-lg" render={<Link href={`/vehicles/${vehicle.id}/edit`} />}>
            <Pencil />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="document">
        <TabsList className="w-full">
          <TabsTrigger value="document">Documenti</TabsTrigger>
          <TabsTrigger value="ordinary">Tagliandi</TabsTrigger>
          <TabsTrigger value="wear">Usura</TabsTrigger>
        </TabsList>
        {(Object.keys(grouped) as Array<keyof typeof grouped>).map((key) => (
          <TabsContent key={key} value={key} className="space-y-3 pt-4">
            {grouped[key].map((projection) => (
              <OperationRow
                key={projection.operation.id}
                projection={projection}
                onComplete={() => {
                  void garageRepository.completeOperation(projection.operation.id, vehicle).then(() => {
                    toast.success(`${projection.operation.name} aggiornato`)
                  })
                }}
                onEdit={() => setEditingId(projection.operation.id)}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => {
          if (window.confirm("Eliminare questo veicolo e tutte le scadenze?")) {
            void garageRepository.deleteVehicle(vehicle.id).then(() => router.push("/"))
          }
        }}
      >
        Rimuovi dal garage
      </Button>

      <ObdSheet
        open={obdOpen}
        onOpenChange={setObdOpen}
        onReading={(reading) => {
          if (reading.odometerKm === null && !reading.vin) {
            toast.error("Lo scanner non ha restituito VIN né chilometri.")
            return
          }
          void garageRepository
            .recordOdometer(
              vehicle.id,
              reading.odometerKm ?? vehicle.odometerKm,
              "obd",
              reading.vin,
            )
            .then(() => toast.success("Chilometri aggiornati"))
        }}
      />

      <OperationEditor
        operation={operations?.find((item) => item.id === editingId) ?? null}
        onClose={() => setEditingId(null)}
      />
    </div>
  )
}
