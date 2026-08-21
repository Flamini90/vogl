import { FUEL_TYPES, type FuelType } from "@/lib/domain/types"

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function read(record: Record<string, unknown>, keys: string[]): unknown {
  const lookup = new Map(
    Object.entries(record).map(([key, value]) => [key.toLowerCase().replace(/[_\s-]/g, ""), value]),
  )

  for (const key of keys) {
    const value = lookup.get(key.toLowerCase().replace(/[_\s-]/g, ""))
    if (value !== undefined && value !== null && value !== "") {
      return value
    }
  }

  return undefined
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }
  return undefined
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export function mapFuel(value: string | undefined): FuelType | null {
  if (!value) {
    return null
  }

  const normalized = value.toLowerCase()

  if (normalized.includes("diesel") || normalized.includes("gasolio")) {
    return "diesel"
  }
  if (normalized.includes("hybrid") || normalized.includes("ibrid")) {
    return "hybrid"
  }
  if (normalized.includes("electric") || normalized.includes("elettr")) {
    return "electric"
  }
  if (normalized.includes("lpg") || normalized.includes("gpl")) {
    return "lpg"
  }
  if (normalized.includes("cng") || normalized.includes("metan") || normalized.includes("natural")) {
    return "cng"
  }
  if (
    normalized.includes("petrol") ||
    normalized.includes("gasoline") ||
    normalized.includes("benz") ||
    normalized.includes("otto")
  ) {
    return "petrol"
  }

  return FUEL_TYPES.includes(normalized as FuelType) ? (normalized as FuelType) : null
}

export function pickIdentityFields(payload: unknown): {
  make?: string
  model?: string
  year?: number
  fuel?: FuelType | null
  displacementCc?: number
  powerKw?: number
  vin?: string
  registrationDate?: string
} {
  const root = asRecord(payload)
  if (!root) {
    return {}
  }

  const nested =
    asRecord(root.data) ??
    asRecord(root.vehicle) ??
    asRecord(root.result) ??
    asRecord(root.Results && Array.isArray(root.Results) ? root.Results[0] : undefined) ??
    root

  const make = asString(read(nested, ["make", "marca", "brand", "manufacturer"]))
  const model = asString(read(nested, ["model", "modello", "commercialName", "version", "allestimento"]))
  const year = asNumber(read(nested, ["year", "anno", "modelyear", "registrationYear", "annoimmatricolazione"]))
  const fuel = mapFuel(asString(read(nested, ["fuel", "alimentazione", "fueltype", "fueltypeprimary"])))
  const displacement =
    asNumber(read(nested, ["displacementcc", "cilindrata", "displacement", "enginecapacity"])) ??
    (() => {
      const liters = asNumber(read(nested, ["displacementl"]))
      return liters ? Math.round(liters * 1000) : undefined
    })()
  const powerKw = asNumber(read(nested, ["powerkw", "kw", "enginekw", "potenza"]))
  const vin = asString(read(nested, ["vin", "telaio", "vehicleidentificationnumber"]))
  const registrationDate = asString(
    read(nested, ["registrationdate", "dataimmatricolazione", "immatricolazione"]),
  )

  return {
    make,
    model,
    year: year ? Math.round(year) : undefined,
    fuel,
    displacementCc: displacement ? Math.round(displacement) : undefined,
    powerKw: powerKw ? Math.round(powerKw) : undefined,
    vin: vin?.toUpperCase(),
    registrationDate: registrationDate?.slice(0, 10),
  }
}
