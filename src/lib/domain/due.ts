import { addMonths, diffDays, todayIso } from "@/lib/domain/dates"
import type {
  DueStatus,
  MaintenanceOperation,
  Vehicle,
} from "@/lib/domain/types"

export type DueProjection = {
  operation: MaintenanceOperation
  status: DueStatus
  dueKm: number | null
  dueAt: string | null
  remainingKm: number | null
  remainingDays: number | null
  progress: number
}

const SOON_DAYS = 21
const SOON_KM = 500

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

function worstStatus(left: DueStatus, right: DueStatus): DueStatus {
  const rank: Record<DueStatus, number> = {
    unset: 0,
    ok: 1,
    soon: 2,
    due: 3,
    overdue: 4,
  }

  return rank[left] >= rank[right] ? left : right
}

function statusFromRemaining(remainingDays: number | null, remainingKm: number | null): DueStatus {
  const dayStatus: DueStatus | null =
    remainingDays === null
      ? null
      : remainingDays < 0
        ? "overdue"
        : remainingDays <= 0
          ? "due"
          : remainingDays <= SOON_DAYS
            ? "soon"
            : "ok"

  const kmStatus: DueStatus | null =
    remainingKm === null
      ? null
      : remainingKm < 0
        ? "overdue"
        : remainingKm <= 0
          ? "due"
          : remainingKm <= SOON_KM
            ? "soon"
            : "ok"

  if (dayStatus && kmStatus) {
    return worstStatus(dayStatus, kmStatus)
  }

  return dayStatus ?? kmStatus ?? "unset"
}

export function projectDue(
  operation: MaintenanceOperation,
  vehicle: Vehicle,
  today = todayIso(),
): DueProjection {
  const dueKm =
    operation.intervalKm !== null
      ? (operation.lastServiceKm ?? 0) + operation.intervalKm
      : null

  const dueAt =
    operation.dueAt ??
    (operation.lastServiceAt && operation.intervalMonths
      ? addMonths(operation.lastServiceAt, operation.intervalMonths)
      : null)

  const remainingKm =
    dueKm === null ? null : dueKm - vehicle.odometerKm
  const remainingDays = dueAt === null ? null : diffDays(today, dueAt)

  const hasAnchor =
    dueKm !== null || dueAt !== null || operation.lastServiceAt !== null || operation.lastServiceKm !== null

  if (!hasAnchor && dueAt === null && dueKm === null) {
    return {
      operation,
      status: "unset",
      dueKm,
      dueAt,
      remainingKm,
      remainingDays,
      progress: 0,
    }
  }

  const kmProgress =
    operation.intervalKm && dueKm !== null
      ? (vehicle.odometerKm - (operation.lastServiceKm ?? 0)) / operation.intervalKm
      : null

  const dayProgress =
    operation.intervalMonths && dueAt !== null && operation.lastServiceAt
      ? 1 - (remainingDays ?? 0) / Math.max(operation.intervalMonths * 30, 1)
      : dueAt
        ? 1 - (remainingDays ?? 0) / Math.max(operation.notifyDaysBefore * 4, 30)
        : null

  const progress = clamp(Math.max(kmProgress ?? 0, dayProgress ?? 0))

  return {
    operation,
    status: statusFromRemaining(remainingDays, remainingKm),
    dueKm,
    dueAt,
    remainingKm,
    remainingDays,
    progress,
  }
}

export function projectVehicleOperations(
  vehicle: Vehicle,
  operations: MaintenanceOperation[],
): DueProjection[] {
  return operations
    .filter((operation) => operation.enabled)
    .map((operation) => projectDue(operation, vehicle))
    .sort(compareDue)
}

export function compareDue(left: DueProjection, right: DueProjection): number {
  const rank: Record<DueStatus, number> = {
    overdue: 0,
    due: 1,
    soon: 2,
    unset: 3,
    ok: 4,
  }

  if (rank[left.status] !== rank[right.status]) {
    return rank[left.status] - rank[right.status]
  }

  const leftDays = left.remainingDays ?? Number.POSITIVE_INFINITY
  const rightDays = right.remainingDays ?? Number.POSITIVE_INFINITY
  if (leftDays !== rightDays) {
    return leftDays - rightDays
  }

  const leftKm = left.remainingKm ?? Number.POSITIVE_INFINITY
  const rightKm = right.remainingKm ?? Number.POSITIVE_INFINITY
  return leftKm - rightKm
}

export function vehicleHealth(projections: DueProjection[]): number {
  if (projections.length === 0) {
    return 100
  }

  const scored = projections.filter((item) => item.status !== "unset")
  if (scored.length === 0) {
    return 100
  }

  const total = scored.reduce((sum, item) => {
    if (item.status === "overdue") {
      return sum + 15
    }
    if (item.status === "due") {
      return sum + 40
    }
    if (item.status === "soon") {
      return sum + 70
    }
    return sum + 100 - item.progress * 20
  }, 0)

  return Math.round(total / scored.length)
}

export function formatDueSummary(projection: DueProjection): string {
  if (projection.status === "unset") {
    return "Imposta data o ultimo intervento"
  }

  const parts: string[] = []
  const { remainingDays, remainingKm } = projection

  if (remainingDays !== null) {
    if (remainingDays < 0) {
      parts.push(`scaduto da ${Math.abs(remainingDays)} giorni`)
    } else if (remainingDays === 0) {
      parts.push("scade oggi")
    } else {
      parts.push(`tra ${remainingDays} giorni`)
    }
  }

  if (remainingKm !== null) {
    if (remainingKm < 0) {
      parts.push(`${Math.abs(remainingKm)} km oltre il limite`)
    } else {
      parts.push(`${remainingKm} km rimanenti`)
    }
  }

  return parts.join(" · ") || "Controlla la scadenza"
}

export function nextProjection(projections: DueProjection[]): DueProjection | null {
  return projections.find((item) => item.status !== "ok") ?? projections[0] ?? null
}

