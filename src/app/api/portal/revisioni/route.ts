import {
  fetchPortalRevisions,
  PORTAL_VEHICLE_TYPES,
  type PortalVehicleType,
} from "@/lib/lookup/portal"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { plate?: unknown; type?: unknown; captchaId?: unknown; captchaText?: unknown }

  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ ok: false, reason: "invalid", message: "Richiesta non valida." }, { status: 400 })
  }

  const plate = typeof body.plate === "string" ? body.plate : ""
  const type = typeof body.type === "string" ? body.type : "A"
  const captchaId = typeof body.captchaId === "string" ? body.captchaId : ""
  const captchaText = typeof body.captchaText === "string" ? body.captchaText : ""

  if (plate.trim().length < 5 || captchaId.length === 0 || captchaText.trim().length === 0) {
    return Response.json(
      { ok: false, reason: "invalid", message: "Targa e codice captcha sono obbligatori." },
      { status: 400 },
    )
  }

  const vehicleType = (PORTAL_VEHICLE_TYPES as readonly string[]).includes(type)
    ? (type as PortalVehicleType)
    : "A"

  const result = await fetchPortalRevisions(plate, vehicleType, captchaId, captchaText.trim())
  const status = result.ok ? 200 : result.reason === "captcha" ? 401 : result.reason === "invalid" ? 400 : result.reason === "no_history" ? 404 : 502

  return Response.json(result, { status })
}