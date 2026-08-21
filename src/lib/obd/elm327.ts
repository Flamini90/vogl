import { connectGatt, disconnectDevice, findUartPair, requestObdDevice } from "@/lib/obd/bluetooth"
import {
  decodeChunk,
  encodeCommand,
  isNoData,
  isPrompt,
  parseOdometer,
  parseVin,
} from "@/lib/obd/protocol"
import { ObdError, type ObdReading } from "@/lib/obd/types"

const INIT_COMMANDS = ["ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0"]
const COMMAND_TIMEOUT_MS = 8_000

export class Elm327Client {
  private device: BluetoothDevice | null = null
  private write: BluetoothRemoteGATTCharacteristic | null = null
  private notify: BluetoothRemoteGATTCharacteristic | null = null
  private buffer = ""
  private waiter: ((chunk: string) => void) | null = null

  async connect(): Promise<string> {
    this.device = await requestObdDevice()
    const server = await connectGatt(this.device)
    const pair = await findUartPair(server)
    this.write = pair.write
    this.notify = pair.notify
    this.buffer = ""

    await this.notify.startNotifications()
    this.notify.addEventListener("characteristicvaluechanged", this.onValue)

    for (const command of INIT_COMMANDS) {
      await this.send(command)
    }

    return this.device.name ?? "ELM327"
  }

  async readVehicle(): Promise<ObdReading> {
    const raw: string[] = []
    const vinResponse = await this.send("0902")
    raw.push(vinResponse)
    const odometerResponse = await this.send("01A6")
    raw.push(odometerResponse)

    return {
      vin: parseVin(vinResponse),
      odometerKm: parseOdometer(odometerResponse),
      raw,
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.notify?.removeEventListener("characteristicvaluechanged", this.onValue)
      if (this.notify?.properties.notify) {
        await this.notify.stopNotifications().catch(() => undefined)
      }
    } finally {
      await disconnectDevice(this.device)
      this.device = null
      this.write = null
      this.notify = null
      this.waiter = null
      this.buffer = ""
    }
  }

  private onValue = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    if (!target.value) {
      return
    }

    this.buffer += decodeChunk(target.value as unknown as BufferSource)
    this.waiter?.(this.buffer)
  }

  private async send(command: string): Promise<string> {
    if (!this.write) {
      throw new ObdError("Scanner non connesso.")
    }

    this.buffer = ""
    await this.write.writeValue(encodeCommand(command) as BufferSource)

    const response = await this.waitForPrompt()
    if (isNoData(response) && command !== "01A6") {
      throw new ObdError(`Nessuna risposta OBD per ${command}.`)
    }

    return response
  }

  private waitForPrompt(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.waiter = null
        reject(new ObdError("Timeout in attesa della centralina."))
      }, COMMAND_TIMEOUT_MS)

      this.waiter = (buffer) => {
        if (!isPrompt(buffer)) {
          return
        }

        window.clearTimeout(timeout)
        this.waiter = null
        resolve(buffer)
      }
    })
  }
}
