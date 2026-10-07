const PORTAL_BASE = "https://www.ilportaledellautomobilista.it/interrogazionistoricorevisioni"
const PORTAL_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36"

export const PORTAL_VEHICLE_TYPES = ["A", "M", "C", "R"] as const
export type PortalVehicleType = (typeof PORTAL_VEHICLE_TYPES)[number]

export type PortalCaptcha = {
  id: string
  imageBase64: string
}

export type PortalRevision = {
  date: string
  km: number | null
  outcome: "P" | "S" | "R"
  cancelled: boolean
  type: string
}

export type PortalRevisionResult =
  | { ok: true; plate: string; type: PortalVehicleType; revisions: PortalRevision[] }
  | {
      ok: false
      reason: "captcha" | "invalid" | "not_found" | "no_history" | "upstream"
      message: string
    }

type CaptchaGenerateResponse = {
  id?: unknown
  image?: unknown
}

type CaptchaVerifyResponse = {
  guid?: unknown
}

type StoricoResponse = {
  codice?: unknown
  esito?: unknown
  messaggio?: unknown
  informations?: unknown
}

type StoricoInformation = {
  datRvs?: unknown
  flgEsiRvsVei?: unknown
  flgAnlRvs?: unknown
  numKmiPcsRvs?: unknown
  plate?: unknown
  type?: unknown
}

function portalHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "User-Agent": PORTAL_UA,
    Accept: "application/json",
    Origin: "https://www.ilportaledellautomobilista.it",
    Referer: "https://www.ilportaledellautomobilista.it/interrogazionistoricorevisioni/spa/",
    ...extra,
  }
}

export async function generatePortalCaptcha(): Promise<PortalRevisionResult | PortalCaptcha> {
  try {
    const response = await fetch(`${PORTAL_BASE}/noauth/captcha/generate`, {
      method: "POST",
      headers: portalHeaders(),
      cache: "no-store",
    })

    if (!response.ok) {
      return {
        ok: false,
        reason: "upstream",
        message: "Il Portale non ha generato il captcha. Riprova tra qualche istante.",
      }
    }

    const payload = (await response.json()) as CaptchaGenerateResponse
    if (typeof payload.id !== "string" || typeof payload.image !== "string") {
      return { ok: false, reason: "upstream", message: "Risposta captcha inattesa dal Portale." }
    }

    return { id: payload.id, imageBase64: payload.image }
  } catch {
    return { ok: false, reason: "upstream", message: "Impossibile contattare il Portale." }
  }
}

function normalizeOutcome(value: unknown): "P" | "S" | "R" {
  return value === "S" || value === "R" ? value : "P"
}

function mapInformations(payload: StoricoResponse): PortalRevision[] {
  if (!Array.isArray(payload.informations)) {
    return []
  }

  return payload.informations
    .map((raw): StoricoInformation => (raw ?? {}) as StoricoInformation)
    .filter((item) => typeof item.datRvs === "string" && item.datRvs.length >= 10)
    .map((item) => ({
      date: (item.datRvs as string).slice(0, 10),
      km:
        typeof item.numKmiPcsRvs === "number" && Number.isFinite(item.numKmiPcsRvs)
          ? Math.round(item.numKmiPcsRvs)
          : null,
      outcome: normalizeOutcome(item.flgEsiRvsVei),
      cancelled: item.flgAnlRvs === "S",
      type: typeof item.type === "string" ? item.type : "A",
    }))
    .sort((left, right) => right.date.localeCompare(left.date))
}

export async function fetchPortalRevisions(
  plate: string,
  type: PortalVehicleType,
  captchaId: string,
  captchaText: string,
): Promise<PortalRevisionResult> {
  const normalizedPlate = plate.trim().toUpperCase()

  try {
    const verifyResponse = await fetch(`${PORTAL_BASE}/noauth/captcha/verify`, {
      method: "POST",
      headers: portalHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id: captchaId, text: captchaText }),
      cache: "no-store",
    })

    if (verifyResponse.status === 401) {
      return { ok: false, reason: "captcha", message: "Codice captcha errato. Riprova con il nuovo codice." }
    }

    if (!verifyResponse.ok) {
      return { ok: false, reason: "upstream", message: "Il Portale ha rifiutato la verifica del captcha." }
    }

    const verified = (await verifyResponse.json()) as CaptchaVerifyResponse
    if (typeof verified.guid !== "string") {
      return { ok: false, reason: "captcha", message: "Verifica captcha non riuscita. Riprova." }
    }

    const storicoResponse = await fetch(
      `${PORTAL_BASE}/api/v1/storicorevisioni/${encodeURIComponent(type)}/${encodeURIComponent(normalizedPlate)}`,
      { headers: portalHeaders({ guid: verified.guid }), cache: "no-store" },
    )

    if (!storicoResponse.ok) {
      return {
        ok: false,
        reason: "not_found",
        message: "Targa non valida o non presente nel Portale.",
      }
    }

    const payload = (await storicoResponse.json()) as StoricoResponse

    if (payload.codice === "499") {
      return {
        ok: false,
        reason: "no_history",
        message: "Nessuna revisione risultata dopo il 1 giugno 2018 per questa targa.",
      }
    }

    if (payload.codice !== "200") {
      return {
        ok: false,
        reason: "upstream",
        message:
          typeof payload.messaggio === "string" && payload.messaggio
            ? payload.messaggio
            : "Il Portale non ha restituito lo storico.",
      }
    }

    const revisions = mapInformations(payload)
    if (revisions.length === 0) {
      return {
        ok: false,
        reason: "no_history",
        message: "Nessuna revisione utilizzabile nel response del Portale.",
      }
    }

    return { ok: true, plate: normalizedPlate, type, revisions }
  } catch {
    return { ok: false, reason: "upstream", message: "Impossibile interrogare il Portale." }
  }
}