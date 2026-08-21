export const FUEL_TYPES = [
  "petrol",
  "diesel",
  "hybrid",
  "electric",
  "lpg",
  "cng",
] as const

export type FuelType = (typeof FUEL_TYPES)[number]

export const IDENTITY_SOURCES = ["plate", "obd", "manual"] as const
export type IdentitySource = (typeof IDENTITY_SOURCES)[number]

export const OPERATION_CATEGORIES = ["document", "ordinary", "wear"] as const
export type OperationCategory = (typeof OPERATION_CATEGORIES)[number]

export const DUE_STATUSES = ["unset", "ok", "soon", "due", "overdue"] as const
export type DueStatus = (typeof DUE_STATUSES)[number]

export const ODOMETER_SOURCES = ["obd", "manual"] as const
export type OdometerSource = (typeof ODOMETER_SOURCES)[number]

export type Vehicle = {
  id: string
  plate: string
  vin: string | null
  nickname: string | null
  make: string
  model: string
  year: number | null
  fuel: FuelType
  displacementCc: number | null
  powerKw: number | null
  registrationDate: string | null
  odometerKm: number
  odometerUpdatedAt: string
  identitySource: IdentitySource
  createdAt: string
  updatedAt: string
}

export type MaintenanceOperation = {
  id: string
  vehicleId: string
  catalogKey: string
  name: string
  category: OperationCategory
  intervalKm: number | null
  intervalMonths: number | null
  lastServiceKm: number | null
  lastServiceAt: string | null
  dueAt: string | null
  notifyDaysBefore: number
  notifyKmBefore: number
  enabled: boolean
  notes: string | null
}

export type OdometerReading = {
  id: string
  vehicleId: string
  km: number
  source: OdometerSource
  vin: string | null
  createdAt: string
}

export type NotificationLog = {
  id: string
  operationId: string
  vehicleId: string
  fingerprint: string
  sentAt: string
}

export type AppSettings = {
  id: "app"
  notificationsEnabled: boolean
  notifyDaysBefore: number
}

export type CreateVehicleInput = {
  plate: string
  vin?: string | null
  nickname?: string | null
  make: string
  model: string
  year?: number | null
  fuel: FuelType
  displacementCc?: number | null
  powerKw?: number | null
  registrationDate?: string | null
  odometerKm: number
  identitySource: IdentitySource
  documents: {
    bolloDueAt?: string | null
    insuranceDueAt?: string | null
    inspectionDueAt?: string | null
  }
}

export type GarageSnapshot = {
  vehicles: Vehicle[]
  operations: MaintenanceOperation[]
  readings: OdometerReading[]
  settings: AppSettings
}
