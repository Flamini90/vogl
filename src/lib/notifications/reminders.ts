import { compareDue, formatDueSummary, projectDue, type DueProjection } from "@/lib/domain/due"
import type { AppSettings, MaintenanceOperation, Vehicle } from "@/lib/domain/types"

export type ReminderPayload = {
  title: string
  body: string
  url: string
  tag: string
  fingerprint: string
  vehicleId: string
  operationId: string
}

export function remindersFromGarage(
  vehicles: Vehicle[],
  operations: MaintenanceOperation[],
  settings: AppSettings,
): ReminderPayload[] {
  const byVehicle = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]))
  const reminders: ReminderPayload[] = []

  for (const operation of operations) {
    if (!operation.enabled) {
      continue
    }

    const vehicle = byVehicle.get(operation.vehicleId)
    if (!vehicle) {
      continue
    }

    const projection = projectDue(operation, vehicle)
    const reminder = toReminder(vehicle, projection, settings)
    if (reminder) {
      reminders.push(reminder)
    }
  }

  return reminders.sort((left, right) => {
    const leftOp = operations.find((item) => item.id === left.operationId)
    const rightOp = operations.find((item) => item.id === right.operationId)
    if (!leftOp || !rightOp) {
      return 0
    }

    const leftVehicle = byVehicle.get(left.vehicleId)
    const rightVehicle = byVehicle.get(right.vehicleId)
    if (!leftVehicle || !rightVehicle) {
      return 0
    }

    return compareDue(projectDue(leftOp, leftVehicle), projectDue(rightOp, rightVehicle))
  })
}

function toReminder(
  vehicle: Vehicle,
  projection: DueProjection,
  settings: AppSettings,
): ReminderPayload | null {
  const { operation, status, remainingDays, remainingKm } = projection
  const label = vehicle.nickname || `${vehicle.make} ${vehicle.model}`
  const notifyDays = Math.max(settings.notifyDaysBefore, operation.notifyDaysBefore)

  const dateHit =
    remainingDays !== null && remainingDays <= notifyDays
  const kmHit =
    remainingKm !== null && remainingKm <= Math.max(operation.notifyKmBefore, 0)

  if (status === "unset" || status === "ok") {
    return null
  }

  if (!dateHit && !kmHit && status !== "overdue" && status !== "due") {
    return null
  }

  const when = formatDueSummary(projection)

  return {
    title: `${operation.name} · ${label}`,
    body: `${vehicle.plate} — ${when}`,
    url: `/vehicles/${vehicle.id}`,
    tag: `vogl-${operation.id}`,
    fingerprint: `${operation.id}:${status}:${remainingDays ?? "x"}:${remainingKm ?? "x"}`,
    vehicleId: vehicle.id,
    operationId: operation.id,
  }
}
