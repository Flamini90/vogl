import { templatesForFuel } from "@/lib/domain/catalog"
import { addMonths, nowIso, todayIso } from "@/lib/domain/dates"
import { createId } from "@/lib/domain/ids"
import { normalizePlate } from "@/lib/domain/plate"
import type {
  AppSettings,
  CreateVehicleInput,
  GarageSnapshot,
  MaintenanceOperation,
  NotificationLog,
  OdometerReading,
  Vehicle,
} from "@/lib/domain/types"
import { db, DEFAULT_SETTINGS } from "@/lib/db/database"

function documentDueAt(
  input: CreateVehicleInput,
  key: "bollo" | "insurance" | "inspection",
): string | null {
  if (key === "bollo") {
    return input.documents.bolloDueAt ?? null
  }
  if (key === "insurance") {
    return input.documents.insuranceDueAt ?? null
  }
  return input.documents.inspectionDueAt ?? null
}

function buildOperations(vehicle: Vehicle, input: CreateVehicleInput): MaintenanceOperation[] {
  return templatesForFuel(vehicle.fuel).map((template) => {
    const isDocument = template.category === "document"
    const dueAt = isDocument
      ? documentDueAt(input, template.key as "bollo" | "insurance" | "inspection")
      : null

    return {
      id: createId(),
      vehicleId: vehicle.id,
      catalogKey: template.key,
      name: template.name,
      category: template.category,
      intervalKm: template.intervalKm,
      intervalMonths: template.intervalMonths,
      lastServiceKm: isDocument ? null : vehicle.odometerKm,
      lastServiceAt: isDocument ? null : todayIso(),
      dueAt,
      notifyDaysBefore: template.notifyDaysBefore,
      notifyKmBefore: template.notifyKmBefore,
      enabled: true,
      notes: null,
    }
  })
}

async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get("app")
  if (existing) {
    return existing
  }

  await db.settings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export const garageRepository = {
  async listVehicles(): Promise<Vehicle[]> {
    return db.vehicles.orderBy("updatedAt").reverse().toArray()
  },

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return db.vehicles.get(id)
  },

  async listOperations(vehicleId: string): Promise<MaintenanceOperation[]> {
    return db.operations.where("vehicleId").equals(vehicleId).toArray()
  },

  async listAllOperations(): Promise<MaintenanceOperation[]> {
    return db.operations.toArray()
  },

  async createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
    const timestamp = nowIso()
    const vehicle: Vehicle = {
      id: createId(),
      plate: normalizePlate(input.plate),
      vin: input.vin?.trim() ? input.vin.trim().toUpperCase() : null,
      nickname: input.nickname?.trim() || null,
      make: input.make.trim(),
      model: input.model.trim(),
      year: input.year ?? null,
      fuel: input.fuel,
      displacementCc: input.displacementCc ?? null,
      powerKw: input.powerKw ?? null,
      registrationDate: input.registrationDate ?? null,
      odometerKm: Math.max(0, Math.round(input.odometerKm)),
      odometerUpdatedAt: timestamp,
      identitySource: input.identitySource,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const operations = buildOperations(vehicle, input)
    const reading: OdometerReading = {
      id: createId(),
      vehicleId: vehicle.id,
      km: vehicle.odometerKm,
      source: input.identitySource === "obd" ? "obd" : "manual",
      vin: vehicle.vin,
      createdAt: timestamp,
    }

    await db.transaction("rw", db.vehicles, db.operations, db.readings, async () => {
      await db.vehicles.add(vehicle)
      await db.operations.bulkAdd(operations)
      await db.readings.add(reading)
    })

    return vehicle
  },

  async updateVehicle(id: string, patch: Partial<Omit<Vehicle, "id" | "createdAt">>): Promise<void> {
    await db.vehicles.update(id, {
      ...patch,
      plate: patch.plate ? normalizePlate(patch.plate) : undefined,
      vin: patch.vin === undefined ? undefined : patch.vin?.trim().toUpperCase() || null,
      updatedAt: nowIso(),
    })
  },

  async recordOdometer(
    vehicleId: string,
    km: number,
    source: OdometerReading["source"],
    vin?: string | null,
  ): Promise<void> {
    const timestamp = nowIso()
    const rounded = Math.max(0, Math.round(km))

    await db.transaction("rw", db.vehicles, db.readings, async () => {
      await db.vehicles.update(vehicleId, {
        odometerKm: rounded,
        odometerUpdatedAt: timestamp,
        vin: vin?.trim() ? vin.trim().toUpperCase() : undefined,
        updatedAt: timestamp,
      })
      await db.readings.add({
        id: createId(),
        vehicleId,
        km: rounded,
        source,
        vin: vin?.trim().toUpperCase() || null,
        createdAt: timestamp,
      })
    })
  },

  async updateOperation(
    id: string,
    patch: Partial<Omit<MaintenanceOperation, "id" | "vehicleId">>,
  ): Promise<void> {
    await db.operations.update(id, patch)
  },

  async completeOperation(id: string, vehicle: Vehicle, at = todayIso()): Promise<void> {
    const operation = await db.operations.get(id)
    if (!operation) {
      return
    }

    const dueAt =
      operation.intervalMonths !== null ? addMonths(at, operation.intervalMonths) : operation.dueAt

    await db.operations.update(id, {
      lastServiceKm: vehicle.odometerKm,
      lastServiceAt: at,
      dueAt,
    })
  },

  async deleteVehicle(id: string): Promise<void> {
    await db.transaction(
      "rw",
      db.vehicles,
      db.operations,
      db.readings,
      db.notificationLogs,
      async () => {
        await db.vehicles.delete(id)
        await db.operations.where("vehicleId").equals(id).delete()
        await db.readings.where("vehicleId").equals(id).delete()
        await db.notificationLogs.where("vehicleId").equals(id).delete()
      },
    )
  },

  async getSettings(): Promise<AppSettings> {
    return ensureSettings()
  },

  async saveSettings(patch: Partial<Omit<AppSettings, "id">>): Promise<void> {
    const current = await ensureSettings()
    await db.settings.put({ ...current, ...patch })
  },

  async listNotificationLogs(): Promise<NotificationLog[]> {
    return db.notificationLogs.toArray()
  },

  async logNotification(entry: Omit<NotificationLog, "id">): Promise<void> {
    await db.notificationLogs.add({ ...entry, id: createId() })
  },

  async exportSnapshot(): Promise<GarageSnapshot> {
    const [vehicles, operations, readings, settings] = await Promise.all([
      db.vehicles.toArray(),
      db.operations.toArray(),
      db.readings.toArray(),
      ensureSettings(),
    ])

    return { vehicles, operations, readings, settings }
  },

  async importSnapshot(snapshot: GarageSnapshot): Promise<void> {
    await db.transaction(
      "rw",
      db.vehicles,
      db.operations,
      db.readings,
      db.settings,
      async () => {
        await db.vehicles.clear()
        await db.operations.clear()
        await db.readings.clear()
        await db.vehicles.bulkAdd(snapshot.vehicles)
        await db.operations.bulkAdd(snapshot.operations)
        await db.readings.bulkAdd(snapshot.readings)
        await db.settings.put(snapshot.settings ?? DEFAULT_SETTINGS)
      },
    )
  },
}
