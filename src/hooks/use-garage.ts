"use client"

import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db/database"
import { garageRepository } from "@/lib/db/garage-repository"
import type { CreateVehicleInput, MaintenanceOperation, Vehicle } from "@/lib/domain/types"

function useClientReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return ready
}

export function useVehicles() {
  const client = useClientReady()
  return useLiveQuery(() => (client ? garageRepository.listVehicles() : undefined), [client])
}

export function useVehicle(id: string | undefined) {
  const client = useClientReady()
  return useLiveQuery(
    () => (client && id ? garageRepository.getVehicle(id) : undefined),
    [client, id],
  )
}

export function useOperations(vehicleId: string | undefined) {
  const client = useClientReady()
  return useLiveQuery(
    () => (client && vehicleId ? garageRepository.listOperations(vehicleId) : []),
    [client, vehicleId],
  )
}

export function useGarageData() {
  const client = useClientReady()
  const vehicles = useLiveQuery(() => (client ? db.vehicles.toArray() : undefined), [client])
  const operations = useLiveQuery(() => (client ? db.operations.toArray() : undefined), [client])
  const settings = useLiveQuery(() => (client ? garageRepository.getSettings() : undefined), [client])

  return {
    vehicles: vehicles ?? [],
    operations: operations ?? [],
    settings,
    ready: client && vehicles !== undefined && operations !== undefined && settings !== undefined,
  }
}

export function vehicleTitle(vehicle: Pick<Vehicle, "nickname" | "make" | "model">): string {
  return vehicle.nickname || `${vehicle.make} ${vehicle.model}`
}

export type { CreateVehicleInput, MaintenanceOperation, Vehicle }
