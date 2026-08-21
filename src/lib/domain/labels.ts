import type { DueStatus, FuelType, IdentitySource, OperationCategory } from "@/lib/domain/types"

export const FUEL_LABELS: Record<FuelType, string> = {
  petrol: "Benzina",
  diesel: "Diesel",
  hybrid: "Ibrida",
  electric: "Elettrica",
  lpg: "GPL",
  cng: "Metano",
}

export const SOURCE_LABELS: Record<IdentitySource, string> = {
  plate: "Targa",
  obd: "Scanner OBD",
  manual: "Inserimento manuale",
}

export const CATEGORY_LABELS: Record<OperationCategory, string> = {
  document: "Documenti",
  ordinary: "Manutenzione ordinaria",
  wear: "Usura",
}

export const STATUS_LABELS: Record<DueStatus, string> = {
  unset: "Da impostare",
  ok: "In regola",
  soon: "In arrivo",
  due: "In scadenza",
  overdue: "Scaduto",
}
