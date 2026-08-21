const COMPACT_PLATE = /[^A-Z0-9]/g

const ITALIAN_PLATE_PATTERNS = [
  /^[A-Z]{2}\d{3}[A-Z]{2}$/,
  /^[A-Z]{2}\d{5}$/,
  /^[A-Z]{1,2}\d{5,6}$/,
]

export function normalizePlate(value: string): string {
  return value.toUpperCase().replace(COMPACT_PLATE, "")
}

export function formatPlate(value: string): string {
  const plate = normalizePlate(value)

  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(plate)) {
    return `${plate.slice(0, 2)} ${plate.slice(2, 5)} ${plate.slice(5)}`
  }

  if (/^[A-Z]{2}\d{5}$/.test(plate)) {
    return `${plate.slice(0, 2)} ${plate.slice(2)}`
  }

  return plate
}

export function isLikelyItalianPlate(value: string): boolean {
  const plate = normalizePlate(value)
  return ITALIAN_PLATE_PATTERNS.some((pattern) => pattern.test(plate))
}

export function plateInputError(value: string): string | null {
  const plate = normalizePlate(value)

  if (plate.length < 5) {
    return "Inserisci la targa completa."
  }

  if (!isLikelyItalianPlate(plate)) {
    return "Formato targa non riconosciuto. Puoi comunque continuare e inserire i dati a mano."
  }

  return null
}
