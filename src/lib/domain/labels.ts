import type {
  DueStatus,
  FuelType,
  IdentitySource,
  JournalKind,
  OperationCategory,
  QuantityUnit,
} from "@/lib/domain/types"

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

export const JOURNAL_LABELS: Record<JournalKind, string> = {
  odometer: "Chilometri",
  refuel: "Rifornimento",
  service: "Intervento",
  expense: "Spesa",
}

export const UNIT_LABELS: Record<QuantityUnit, string> = {
  l: "L",
  kwh: "kWh",
}
