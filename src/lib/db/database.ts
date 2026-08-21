import Dexie, { type EntityTable } from "dexie"
import type {
  AppSettings,
  MaintenanceOperation,
  NotificationLog,
  OdometerReading,
  Vehicle,
} from "@/lib/domain/types"

export const DEFAULT_SETTINGS: AppSettings = {
  id: "app",
  notificationsEnabled: false,
  notifyDaysBefore: 14,
}

export class VoglDatabase extends Dexie {
  vehicles!: EntityTable<Vehicle, "id">
  operations!: EntityTable<MaintenanceOperation, "id">
  readings!: EntityTable<OdometerReading, "id">
  notificationLogs!: EntityTable<NotificationLog, "id">
  settings!: EntityTable<AppSettings, "id">

  constructor() {
    super("vogl")

    this.version(1).stores({
      vehicles: "id, plate, updatedAt",
      operations: "id, vehicleId, catalogKey, category",
      readings: "id, vehicleId, createdAt",
      notificationLogs: "id, operationId, vehicleId, fingerprint",
      settings: "id",
    })
  }
}

export const db = new VoglDatabase()
