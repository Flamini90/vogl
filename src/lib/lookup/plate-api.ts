import { isLikelyItalianPlate, normalizePlate } from "@/lib/domain/plate"
import { pickIdentityFields } from "@/lib/lookup/map-identity"
import type { LookupResult } from "@/lib/lookup/types"

function authHeader(token: string): string {
  if (/^(bearer|basic)\s/i.test(token)) {
    return token
  }

  return `Bearer ${token}`
}

export async function lookupPlate(plate: string): Promise<LookupResult> {
  const normalized = normalizePlate(plate)

  if (!isLikelyItalianPlate(normalized)) {
    return {
      ok: false,
      reason: "invalid",
      message: "Targa non riconosciuta come formato italiano.",
    }
  }

  const endpoint = process.env.PLATE_LOOKUP_ENDPOINT
  const token = process.env.PLATE_LOOKUP_TOKEN

  if (!endpoint || !token) {
    return {
      ok: false,
      reason: "unavailable",
      message:
        "Nessuna anagrafe targa configurata. Collega lo scanner OBD oppure inserisci marca e modello a mano.",
    }
  }

  const url = endpoint.replace("{plate}", encodeURIComponent(normalized.toLowerCase()))

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: authHeader(token),
      },
      cache: "no-store",
    })

    if (response.status === 404) {
      return { ok: false, reason: "not_found", message: "Nessun veicolo trovato per questa targa." }
    }

    if (!response.ok) {
      return { ok: false, reason: "upstream", message: "Il servizio targa ha rifiutato la richiesta." }
    }

    const payload: unknown = await response.json()
    const fields = pickIdentityFields(payload)

    if (!fields.make && !fields.model) {
      return { ok: false, reason: "not_found", message: "Targa trovata ma senza dati veicolo utilizzabili." }
    }

    return {
      ok: true,
      identity: {
        plate: normalized,
        vin: fields.vin ?? null,
        make: fields.make ?? "Sconosciuta",
        model: fields.model ?? "Modello non indicato",
        year: fields.year ?? null,
        fuel: fields.fuel ?? null,
        displacementCc: fields.displacementCc ?? null,
        powerKw: fields.powerKw ?? null,
        registrationDate: fields.registrationDate ?? null,
        source: "plate",
      },
    }
  } catch {
    return { ok: false, reason: "upstream", message: "Impossibile contattare il servizio targa." }
  }
}
