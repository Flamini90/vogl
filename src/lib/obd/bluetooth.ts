import { ObdError, type BleCharacteristicPair } from "@/lib/obd/types"

const OPTIONAL_SERVICES: BluetoothServiceUUID[] = [
  0xfff0,
  0xffe0,
  0x1800,
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
]

function canWrite(characteristic: BluetoothRemoteGATTCharacteristic): boolean {
  const { properties } = characteristic
  return properties.write || properties.writeWithoutResponse
}

function canNotify(characteristic: BluetoothRemoteGATTCharacteristic): boolean {
  return characteristic.properties.notify || characteristic.properties.indicate
}

export async function requestObdDevice(): Promise<BluetoothDevice> {
  if (!navigator.bluetooth) {
    throw new ObdError("Web Bluetooth non è disponibile su questo browser.")
  }

  return navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: OPTIONAL_SERVICES,
  })
}

export async function connectGatt(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
  if (!device.gatt) {
    throw new ObdError("Il dispositivo non espone un server GATT.")
  }

  return device.gatt.connect()
}

export async function findUartPair(server: BluetoothRemoteGATTServer): Promise<BleCharacteristicPair> {
  const services = await server.getPrimaryServices()
  const writable: BluetoothRemoteGATTCharacteristic[] = []
  const notifiable: BluetoothRemoteGATTCharacteristic[] = []

  for (const service of services) {
    const characteristics = await service.getCharacteristics()
    for (const characteristic of characteristics) {
      if (canWrite(characteristic)) {
        writable.push(characteristic)
      }
      if (canNotify(characteristic)) {
        notifiable.push(characteristic)
      }
    }
  }

  const shared = writable.find((item) => notifiable.some((other) => other.uuid === item.uuid))
  const write = shared ?? writable[0]
  const notify =
    shared ?? notifiable.find((item) => item.uuid !== write?.uuid) ?? notifiable[0]

  if (!write || !notify) {
    throw new ObdError(
      "Adattatore trovato, ma senza canale UART BLE. Serve un ELM327 Bluetooth Low Energy, non un modello classico.",
    )
  }

  return { write, notify }
}

export async function disconnectDevice(device: BluetoothDevice | null): Promise<void> {
  if (device?.gatt?.connected) {
    device.gatt.disconnect()
  }
}
