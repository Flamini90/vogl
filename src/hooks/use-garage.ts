"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db/database"
import { garageRepository } from "@/lib/db/garage-repository"
import type { CreateVehicleInput, MaintenanceOperation, Vehicle } from "@/lib/domain/types"

export function useVehicles() {
  return useLiveQuery(() => garageRepository.listVehicles(), [])
}

export function useVehicle(id: string | undefined) {
  return useLiveQuery(() => (id ? garageRepository.getVehicle(id) : undefined), [id])
}

export function useOperations(vehicleId: string | undefined) {
  return useLiveQuery(
    () => (vehicleId ? garageRepository.listOperations(vehicleId) : []),
    [vehicleId],
  )
}

export function useGarageData() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), [])
  const operations = useLiveQuery(() => db.operations.toArray(), [])
  const settings = useLiveQuery(() => garageRepository.getSettings(), [])

  return {
    vehicles: vehicles ?? [],
    operations: operations ?? [],
    settings,
    ready: vehicles !== undefined && operations !== undefined && settings !== undefined,
  }
}

export function vehicleTitle(vehicle: Pick<Vehicle, "nickname" | "make" | "model">): string {
  return vehicle.nickname || `${vehicle.make} ${vehicle.model}`
}

export type { CreateVehicleInput, MaintenanceOperation, Vehicle }
