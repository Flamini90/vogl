import { currentYear, formatDecimal } from "./dates"
import type { FuelType, JournalEntry, QuantityUnit } from "./types"

export type ConsumptionSample = {
  fromId: string
  toId: string
  km: number
  quantity: number
  per100: number
  amount: number | null
  costPerKm: number | null
}

export function quantityUnitForFuel(fuel: FuelType): QuantityUnit {
  return fuel === "electric" ? "kwh" : "l"
}

export function refuelTitle(fuel: FuelType): string {
  return fuel === "electric" ? "Ricarica" : "Rifornimento"
}

function isFullFill(entry: JournalEntry): boolean {
  return (
    entry.kind === "refuel" &&
    entry.fullTank &&
    entry.quantity !== null &&
    entry.quantity > 0 &&
    entry.km >= 0
  )
}

export function consumptionSamples(entries: JournalEntry[]): ConsumptionSample[] {
  const fills = entries.filter(isFullFill).sort((left, right) => {
    if (left.km !== right.km) {
      return left.km - right.km
    }

    return left.createdAt.localeCompare(right.createdAt)
  })

  const samples: ConsumptionSample[] = []

  for (let index = 1; index < fills.length; index += 1) {
    const previous = fills[index - 1]
    const current = fills[index]
    const deltaKm = current.km - previous.km
    const quantity = current.quantity ?? 0

    if (deltaKm <= 0 || quantity <= 0) {
      continue
    }

    samples.push({
      fromId: previous.id,
      toId: current.id,
      km: deltaKm,
      quantity,
      per100: (quantity / deltaKm) * 100,
      amount: current.amount,
      costPerKm: current.amount !== null ? current.amount / deltaKm : null,
    })
  }

  return samples
}

export function averagePer100(entries: JournalEntry[], limit = 8): number | null {
  const samples = consumptionSamples(entries)
  if (samples.length === 0) {
    return null
  }

  const recent = samples.slice(-limit)
  const total = recent.reduce((sum, sample) => sum + sample.per100, 0)
  return total / recent.length
}

export function averageCostPerKm(entries: JournalEntry[], limit = 8): number | null {
  const samples = consumptionSamples(entries).filter((sample) => sample.costPerKm !== null)
  if (samples.length === 0) {
    return null
  }

  const recent = samples.slice(-limit)
  const total = recent.reduce((sum, sample) => sum + (sample.costPerKm ?? 0), 0)
  return total / recent.length
}

export function spendInYear(entries: JournalEntry[], year = currentYear()): number {
  const prefix = String(year)
  return entries.reduce((sum, entry) => {
    if (!entry.amount || !entry.at.startsWith(prefix)) {
      return sum
    }

    return sum + entry.amount
  }, 0)
}

export function lastRefuel(entries: JournalEntry[]): JournalEntry | null {
  return (
    entries
      .filter((entry) => entry.kind === "refuel")
      .sort((left, right) => right.at.localeCompare(left.at) || right.createdAt.localeCompare(left.createdAt))[0] ??
    null
  )
}

export function sortJournal(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((left, right) => {
    if (left.at !== right.at) {
      return right.at.localeCompare(left.at)
    }

    return right.createdAt.localeCompare(left.createdAt)
  })
}

export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(",", ".")
  if (!normalized) {
    return null
  }

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatPer100(value: number, unit: QuantityUnit): string {
  const suffix = unit === "kwh" ? "kWh/100 km" : "L/100 km"
  return `${formatDecimal(value)} ${suffix}`
}
