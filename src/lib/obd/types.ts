export type ObdReading = {
  vin: string | null
  odometerKm: number | null
  raw: string[]
}

export type BleCharacteristicPair = {
  write: BluetoothRemoteGATTCharacteristic
  notify: BluetoothRemoteGATTCharacteristic
}

export class ObdError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ObdError"
  }
}

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator
}
