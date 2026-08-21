import type { LookupResult } from "@/lib/lookup/types"

const FALLBACK: LookupResult = {
  ok: false,
  reason: "unavailable",
  message:
    "Nessuna anagrafe targa configurata. Collega lo scanner OBD oppure inserisci marca e modello a mano.",
}

async function readLookup(path: string): Promise<LookupResult> {
  try {
    const response = await fetch(path)
    const result = (await response.json()) as LookupResult

    if (result && typeof result.ok === "boolean") {
      return result
    }
  } catch {
    // The caller still advances: plate lookup is optional.
  }

  return FALLBACK
}

export function lookupPlateClient(plate: string): Promise<LookupResult> {
  return readLookup(`/api/lookup/plate?plate=${encodeURIComponent(plate)}`)
}

export function lookupVinClient(vin: string): Promise<LookupResult> {
  return readLookup(`/api/lookup/vin?vin=${encodeURIComponent(vin)}`)
}
