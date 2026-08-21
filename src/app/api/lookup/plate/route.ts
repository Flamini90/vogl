import { lookupPlate } from "@/lib/lookup/plate-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const plate = searchParams.get("plate") ?? ""

  const result = await lookupPlate(plate)
  const status = result.ok ? 200 : result.reason === "unavailable" ? 501 : 404

  return Response.json(result, { status })
}
