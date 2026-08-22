import { decodeVinCarApi } from "@/lib/lookup/carapi"
import { pickIdentityFields } from "@/lib/lookup/map-identity"
import type { LookupResult } from "@/lib/lookup/types"

const NHTSA_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues"

export function isVin(value: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(value.trim())
}

export async function decodeVin(vin: string): Promise<LookupResult> {
  const normalized = vin.trim().toUpperCase()

  if (!isVin(normalized)) {
    return { ok: false, reason: "invalid", message: "VIN non valido. Deve contenere 17 caratteri." }
  }

  const carapi = await decodeVinCarApi(normalized)
  if (carapi.ok) {
    return carapi
  }

  return decodeVinNhtsa(normalized)
}

async function decodeVinNhtsa(normalized: string): Promise<LookupResult> {
  try {
    const response = await fetch(`${NHTSA_URL}/${normalized}?format=json`, {
      cache: "force-cache",
    })

    if (!response.ok) {
      return { ok: false, reason: "upstream", message: "Il decodificatore VIN non è al momento disponibile." }
    }

    const payload: unknown = await response.json()
    const fields = pickIdentityFields(payload)

    if (!fields.make && !fields.model) {
      return { ok: false, reason: "not_found", message: "VIN riconosciuto ma senza anagrafica utile." }
    }

    return {
      ok: true,
      identity: {
        vin: normalized,
        make: fields.make ?? "Sconosciuta",
        model: fields.model ?? "Modello non indicato",
        year: fields.year ?? null,
        fuel: fields.fuel ?? null,
        displacementCc: fields.displacementCc ?? null,
        powerKw: fields.powerKw ?? null,
        source: "vin",
      },
    }
  } catch {
    return { ok: false, reason: "upstream", message: "Impossibile contattare il decodificatore VIN." }
  }
}
