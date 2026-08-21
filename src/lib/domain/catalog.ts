import type { FuelType, OperationCategory } from "@/lib/domain/types"

export type CatalogTemplate = {
  key: string
  name: string
  category: OperationCategory
  intervalKm: number | null
  intervalMonths: number | null
  notifyDaysBefore: number
  notifyKmBefore: number
  fuels?: readonly FuelType[]
}

const ALL_FUELS: readonly FuelType[] = [
  "petrol",
  "diesel",
  "hybrid",
  "electric",
  "lpg",
  "cng",
]

const COMBUSTION: readonly FuelType[] = [
  "petrol",
  "diesel",
  "hybrid",
  "lpg",
  "cng",
]

export const MAINTENANCE_CATALOG: readonly CatalogTemplate[] = [
  {
    key: "bollo",
    name: "Bollo",
    category: "document",
    intervalKm: null,
    intervalMonths: 12,
    notifyDaysBefore: 21,
    notifyKmBefore: 0,
    fuels: ALL_FUELS,
  },
  {
    key: "insurance",
    name: "Assicurazione",
    category: "document",
    intervalKm: null,
    intervalMonths: 12,
    notifyDaysBefore: 14,
    notifyKmBefore: 0,
    fuels: ALL_FUELS,
  },
  {
    key: "inspection",
    name: "Revisione",
    category: "document",
    intervalKm: null,
    intervalMonths: 24,
    notifyDaysBefore: 30,
    notifyKmBefore: 0,
    fuels: ALL_FUELS,
  },
  {
    key: "oil",
    name: "Tagliando olio e filtri",
    category: "ordinary",
    intervalKm: 15_000,
    intervalMonths: 12,
    notifyDaysBefore: 14,
    notifyKmBefore: 500,
    fuels: COMBUSTION,
  },
  {
    key: "cabin_filter",
    name: "Filtro abitacolo",
    category: "ordinary",
    intervalKm: 15_000,
    intervalMonths: 12,
    notifyDaysBefore: 14,
    notifyKmBefore: 500,
    fuels: ALL_FUELS,
  },
  {
    key: "air_filter",
    name: "Filtro aria",
    category: "ordinary",
    intervalKm: 30_000,
    intervalMonths: 24,
    notifyDaysBefore: 14,
    notifyKmBefore: 800,
    fuels: COMBUSTION,
  },
  {
    key: "fuel_filter",
    name: "Filtro carburante",
    category: "ordinary",
    intervalKm: 30_000,
    intervalMonths: 24,
    notifyDaysBefore: 14,
    notifyKmBefore: 800,
    fuels: ["diesel", "petrol", "lpg", "cng"],
  },
  {
    key: "spark_plugs",
    name: "Candele",
    category: "ordinary",
    intervalKm: 40_000,
    intervalMonths: 36,
    notifyDaysBefore: 14,
    notifyKmBefore: 1_000,
    fuels: ["petrol", "hybrid", "lpg"],
  },
  {
    key: "brake_fluid",
    name: "Liquido freni",
    category: "ordinary",
    intervalKm: null,
    intervalMonths: 24,
    notifyDaysBefore: 21,
    notifyKmBefore: 0,
    fuels: ALL_FUELS,
  },
  {
    key: "coolant",
    name: "Liquido di raffreddamento",
    category: "ordinary",
    intervalKm: 60_000,
    intervalMonths: 48,
    notifyDaysBefore: 21,
    notifyKmBefore: 1_000,
    fuels: ALL_FUELS,
  },
  {
    key: "timing_belt",
    name: "Cinghia di distribuzione",
    category: "ordinary",
    intervalKm: 100_000,
    intervalMonths: 60,
    notifyDaysBefore: 30,
    notifyKmBefore: 2_000,
    fuels: COMBUSTION,
  },
  {
    key: "gearbox_oil",
    name: "Olio cambio",
    category: "ordinary",
    intervalKm: 60_000,
    intervalMonths: 60,
    notifyDaysBefore: 21,
    notifyKmBefore: 1_000,
    fuels: COMBUSTION,
  },
  {
    key: "dpf",
    name: "Controllo FAP / DPF",
    category: "ordinary",
    intervalKm: 40_000,
    intervalMonths: 24,
    notifyDaysBefore: 14,
    notifyKmBefore: 1_000,
    fuels: ["diesel"],
  },
  {
    key: "brakes",
    name: "Freni",
    category: "wear",
    intervalKm: 30_000,
    intervalMonths: 24,
    notifyDaysBefore: 14,
    notifyKmBefore: 1_000,
    fuels: ALL_FUELS,
  },
  {
    key: "tires",
    name: "Pneumatici",
    category: "wear",
    intervalKm: 40_000,
    intervalMonths: 48,
    notifyDaysBefore: 14,
    notifyKmBefore: 1_000,
    fuels: ALL_FUELS,
  },
  {
    key: "battery",
    name: "Batteria servizi",
    category: "wear",
    intervalKm: null,
    intervalMonths: 48,
    notifyDaysBefore: 21,
    notifyKmBefore: 0,
    fuels: ALL_FUELS,
  },
  {
    key: "ac_service",
    name: "Climatizzatore",
    category: "ordinary",
    intervalKm: null,
    intervalMonths: 24,
    notifyDaysBefore: 14,
    notifyKmBefore: 0,
    fuels: ALL_FUELS,
  },
]

export function templatesForFuel(fuel: FuelType): CatalogTemplate[] {
  return MAINTENANCE_CATALOG.filter((template) => {
    if (!template.fuels) {
      return true
    }

    return template.fuels.includes(fuel)
  })
}
