import { templatesForFuel } from "@/lib/domain/catalog"
import { addMonths, nowIso, todayIso } from "@/lib/domain/dates"
import { createId } from "@/lib/domain/ids"
import { normalizePlate } from "@/lib/domain/plate"
import type {
  AppSettings,
  CreateJournalInput,
  CreateVehicleInput,
  GarageSnapshot,
  JournalEntry,
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
    const source = input.identitySource === "obd" ? "obd" : "manual"
    const reading: OdometerReading = {
      id: createId(),
      vehicleId: vehicle.id,
      km: vehicle.odometerKm,
      source,
      vin: vehicle.vin,
      createdAt: timestamp,
    }
    const opening: JournalEntry = {
      id: createId(),
      vehicleId: vehicle.id,
      kind: "odometer",
      at: todayIso(),
      createdAt: timestamp,
      km: vehicle.odometerKm,
      title: source === "obd" ? "Prima lettura OBD" : "Prima rilevazione",
      notes: null,
      quantity: null,
      unit: null,
      amount: null,
      fullTank: false,
      operationId: null,
      catalogKey: null,
    }

    await db.transaction("rw", db.vehicles, db.operations, db.readings, db.journal, async () => {
      await db.vehicles.add(vehicle)
      await db.operations.bulkAdd(operations)
      await db.readings.add(reading)
      await db.journal.add(opening)
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

    await db.transaction("rw", db.vehicles, db.readings, db.journal, async () => {
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
      await db.journal.add({
        id: createId(),
        vehicleId,
        kind: "odometer",
        at: todayIso(),
        createdAt: timestamp,
        km: rounded,
        title: source === "obd" ? "Lettura OBD" : "Chilometri aggiornati",
        notes: null,
        quantity: null,
        unit: null,
        amount: null,
        fullTank: false,
        operationId: null,
        catalogKey: null,
      })
    })
  },

  async updateOperation(
    id: string,
    patch: Partial<Omit<MaintenanceOperation, "id" | "vehicleId">>,
  ): Promise<void> {
    await db.operations.update(id, patch)
  },

  async completeOperation(
    id: string,
    vehicle: Vehicle,
    options: { at?: string; amount?: number | null; notes?: string | null } = {},
  ): Promise<void> {
    const operation = await db.operations.get(id)
    if (!operation) {
      return
    }

    const at = options.at ?? todayIso()
    const timestamp = nowIso()
    const dueAt =
      operation.intervalMonths !== null ? addMonths(at, operation.intervalMonths) : operation.dueAt

    const entry: JournalEntry = {
      id: createId(),
      vehicleId: vehicle.id,
      kind: "service",
      at,
      createdAt: timestamp,
      km: vehicle.odometerKm,
      title: operation.name,
      notes: options.notes?.trim() || null,
      quantity: null,
      unit: null,
      amount: options.amount ?? null,
      fullTank: false,
      operationId: operation.id,
      catalogKey: operation.catalogKey,
    }

    await db.transaction("rw", db.operations, db.journal, async () => {
      await db.operations.update(id, {
        lastServiceKm: vehicle.odometerKm,
        lastServiceAt: at,
        dueAt,
        notes: options.notes?.trim() || operation.notes,
      })
      await db.journal.add(entry)
    })
  },

  async deleteVehicle(id: string): Promise<void> {
    await db.transaction(
      "rw",
      db.vehicles,
      db.operations,
      db.readings,
      db.notificationLogs,
      db.journal,
      async () => {
        await db.vehicles.delete(id)
        await db.operations.where("vehicleId").equals(id).delete()
        await db.readings.where("vehicleId").equals(id).delete()
        await db.notificationLogs.where("vehicleId").equals(id).delete()
        await db.journal.where("vehicleId").equals(id).delete()
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

  async listJournal(vehicleId: string): Promise<JournalEntry[]> {
    return db.journal.where("vehicleId").equals(vehicleId).toArray()
  },

  async listAllJournal(): Promise<JournalEntry[]> {
    return db.journal.toArray()
  },

  async addJournalEntry(input: CreateJournalInput): Promise<JournalEntry> {
    const timestamp = nowIso()
    const at = input.at ?? todayIso()
    const km = Math.max(0, Math.round(input.km))
    const source = input.odometerSource ?? "manual"
    const entry: JournalEntry = {
      id: createId(),
      vehicleId: input.vehicleId,
      kind: input.kind,
      at,
      createdAt: timestamp,
      km,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      amount: input.amount ?? null,
      fullTank: Boolean(input.fullTank),
      operationId: input.operationId ?? null,
      catalogKey: input.catalogKey ?? null,
    }

    await db.transaction("rw", db.vehicles, db.readings, db.journal, async () => {
      const vehicle = await db.vehicles.get(input.vehicleId)
      await db.journal.add(entry)

      if (!vehicle) {
        return
      }

      const shouldUpdate =
        input.kind === "odometer" ? km !== vehicle.odometerKm : km > vehicle.odometerKm

      if (!shouldUpdate) {
        return
      }

      await db.vehicles.update(input.vehicleId, {
        odometerKm: km,
        odometerUpdatedAt: timestamp,
        updatedAt: timestamp,
      })
      await db.readings.add({
        id: createId(),
        vehicleId: input.vehicleId,
        km,
        source,
        vin: vehicle.vin,
        createdAt: timestamp,
      })
    })

    return entry
  },

  async deleteJournalEntry(id: string): Promise<void> {
    await db.journal.delete(id)
  },

  async exportSnapshot(): Promise<GarageSnapshot> {
    const [vehicles, operations, readings, journal, settings] = await Promise.all([
      db.vehicles.toArray(),
      db.operations.toArray(),
      db.readings.toArray(),
      db.journal.toArray(),
      ensureSettings(),
    ])

    return { vehicles, operations, readings, journal, settings }
  },

  async importSnapshot(snapshot: GarageSnapshot): Promise<void> {
    await db.transaction(
      "rw",
      db.vehicles,
      db.operations,
      db.readings,
      db.journal,
      db.settings,
      async () => {
        await db.vehicles.clear()
        await db.operations.clear()
        await db.readings.clear()
        await db.journal.clear()
        await db.vehicles.bulkAdd(snapshot.vehicles)
        await db.operations.bulkAdd(snapshot.operations)
        await db.readings.bulkAdd(snapshot.readings)
        await db.journal.bulkAdd(snapshot.journal ?? [])
        await db.settings.put(snapshot.settings ?? DEFAULT_SETTINGS)
      },
    )
  },
}
