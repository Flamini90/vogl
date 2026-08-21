import type { FuelType } from "@/lib/domain/types"

export type VehicleIdentity = {
  plate?: string
  vin?: string | null
  make: string
  model: string
  year?: number | null
  fuel?: FuelType | null
  displacementCc?: number | null
  powerKw?: number | null
  registrationDate?: string | null
  source: "plate" | "vin"
}

export type LookupResult =
  | { ok: true; identity: VehicleIdentity }
  | { ok: false; reason: "not_found" | "unavailable" | "invalid" | "upstream"; message: string }
