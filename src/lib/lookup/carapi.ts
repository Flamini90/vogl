import { pickIdentityFields } from "@/lib/lookup/map-identity"
import type { LookupResult, VehicleIdentity } from "@/lib/lookup/types"

const CARAPI_VIN_URL = "https://api.carapi.dev/v1/vin-decode"

function carapiToken(): string {
  return process.env.CARAPI_VIN_TOKEN?.trim() || "carapi_7d7539a87e75675bb0de4e3774e3e975"
}

function identityFromCarApi(payload: unknown, vin: string): VehicleIdentity | null {
  const fields = pickIdentityFields(payload)
  const model = fields.model?.trim()
  if (!model) {
    return null
  }

  return {
    vin: fields.vin ?? vin,
    make: fields.make?.trim() || "Sconosciuta",
    model,
    year: fields.year ?? null,
    fuel: fields.fuel ?? null,
    displacementCc: fields.displacementCc ?? null,
    powerKw: fields.powerKw ?? null,
    registrationDate: fields.registrationDate ?? null,
    source: "vin",
  }
}

export async function decodeVinCarApi(vin: string): Promise<LookupResult> {
  const token = carapiToken()
  const url = `${CARAPI_VIN_URL}/${encodeURIComponent(vin)}?token=${encodeURIComponent(token)}`

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    })

    if (response.status === 404) {
      return { ok: false, reason: "not_found", message: "VIN non trovato nel database CarAPI." }
    }

    if (response.status === 400) {
      return { ok: false, reason: "invalid", message: "VIN non valido per il decodificatore." }
    }

    if (!response.ok) {
      return { ok: false, reason: "upstream", message: "Il decodificatore VIN non è al momento disponibile." }
    }

    const payload: unknown = await response.json()
    const identity = identityFromCarApi(payload, vin)

    if (!identity) {
      return { ok: false, reason: "not_found", message: "VIN riconosciuto ma senza modello." }
    }

    return { ok: true, identity }
  } catch {
    return { ok: false, reason: "upstream", message: "Impossibile contattare il decodificatore VIN." }
  }
}
