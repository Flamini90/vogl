const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toHexBytes(hex: string): number[] {
  const compact = hex.replace(/[^0-9A-Fa-f]/g, "")
  const bytes: number[] = []

  for (let index = 0; index < compact.length; index += 2) {
    bytes.push(Number.parseInt(compact.slice(index, index + 2), 16))
  }

  return bytes
}

function hexToAscii(hex: string): string {
  return toHexBytes(hex)
    .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ""))
    .join("")
}

export function parseVin(response: string): string | null {
  const compact = response.replace(/[\s\r\n>]/g, "").toUpperCase()
  const marker = compact.indexOf("4902")
  const payload = marker >= 0 ? compact.slice(marker + 4) : compact
  const ascii = hexToAscii(payload).replace(/[^A-HJ-NPR-Z0-9]/gi, "")
  const match = ascii.match(/[A-HJ-NPR-Z0-9]{17}/i)
  return match ? match[0].toUpperCase() : null
}

export function parseOdometer(response: string): number | null {
  const compact = response.replace(/[\s\r\n>]/g, "").toUpperCase()
  const marker = compact.search(/41A6/)
  if (marker < 0) {
    return null
  }

  const bytes = toHexBytes(compact.slice(marker + 4))
  if (bytes.length < 4) {
    return null
  }

  const raw = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
  if (raw === 0 || raw > 10_000_000) {
    return null
  }

  const km = raw > 1_000_000 ? raw / 10 : raw
  return Math.round(km)
}

export function encodeCommand(command: string): Uint8Array {
  const normalized = command.endsWith("\r") ? command : `${command}\r`
  return encoder.encode(normalized)
}

export function decodeChunk(value: BufferSource | DataView): string {
  if (value instanceof ArrayBuffer) {
    return decoder.decode(value)
  }

  return decoder.decode(value as unknown as ArrayBuffer)
}

export function isPrompt(buffer: string): boolean {
  return buffer.includes(">")
}

export function isNoData(buffer: string): boolean {
  return /NO DATA|UNABLE TO CONNECT|STOPPED|ERROR/i.test(buffer)
}
