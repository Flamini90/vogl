const DAY_MS = 86_400_000

function atNoon(isoDate: string): Date {
  const datePart = isoDate.slice(0, 10)
  return new Date(`${datePart}T12:00:00`)
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function addMonths(isoDate: string, months: number): string {
  const date = atNoon(isoDate)
  date.setMonth(date.getMonth() + months)
  return toIsoDate(date)
}

export function diffDays(fromIso: string, toIso: string): number {
  const from = atNoon(fromIso).getTime()
  const to = atNoon(toIso).getTime()
  return Math.round((to - from) / DAY_MS)
}

export function formatDateIt(isoDate: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(atNoon(isoDate))
}

export function formatNumberIt(value: number): string {
  return new Intl.NumberFormat("it-IT").format(value)
}

export function formatKm(value: number): string {
  return `${formatNumberIt(Math.round(value))} km`
}
