"use client"

import { useSyncExternalStore } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db/database"
import { garageRepository } from "@/lib/db/garage-repository"
import type { CreateVehicleInput, JournalEntry, MaintenanceOperation, Vehicle } from "@/lib/domain/types"

function subscribeNever() {
  return () => {}
}

function useClientReady() {
  return useSyncExternalStore(subscribeNever, () => true, () => false)
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
  const vehicles = useLiveQuery(
    () => (client ? db.vehicles.toArray() : Promise.resolve(undefined as Vehicle[] | undefined)),
    [client],
  )
  const operations = useLiveQuery(
    () =>
      client ? db.operations.toArray() : Promise.resolve(undefined as MaintenanceOperation[] | undefined),
    [client],
  )
  const journal = useLiveQuery(
    () => (client ? db.journal.toArray() : Promise.resolve(undefined as JournalEntry[] | undefined)),
    [client],
  )
  const settings = useLiveQuery(() => (client ? garageRepository.getSettings() : undefined), [client])

  return {
    vehicles: vehicles ?? [],
    operations: operations ?? [],
    journal: journal ?? [],
    settings,
    ready:
      client &&
      vehicles !== undefined &&
      operations !== undefined &&
      journal !== undefined &&
      settings !== undefined,
  }
}

export function useJournal(vehicleId: string | undefined) {
  const client = useClientReady()
  return useLiveQuery(
    () => (client && vehicleId ? garageRepository.listJournal(vehicleId) : []),
    [client, vehicleId],
  )
}

export function vehicleTitle(vehicle: Pick<Vehicle, "nickname" | "make" | "model">): string {
  return vehicle.nickname || `${vehicle.make} ${vehicle.model}`
}

export type { CreateVehicleInput, MaintenanceOperation, Vehicle }
