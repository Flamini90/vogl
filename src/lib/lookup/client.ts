import type { LookupResult } from "@/lib/lookup/types"

async function readLookup(path: string): Promise<LookupResult> {
  const response = await fetch(path)
  const result = (await response.json()) as LookupResult
  return result
}

export function lookupPlateClient(plate: string): Promise<LookupResult> {
  return readLookup(`/api/lookup/plate?plate=${encodeURIComponent(plate)}`)
}

export function lookupVinClient(vin: string): Promise<LookupResult> {
  return readLookup(`/api/lookup/vin?vin=${encodeURIComponent(vin)}`)
}
