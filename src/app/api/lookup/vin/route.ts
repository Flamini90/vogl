import { decodeVin } from "@/lib/lookup/nhtsa"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vin = searchParams.get("vin") ?? ""

  const result = await decodeVin(vin)
  const status = result.ok ? 200 : result.reason === "invalid" ? 400 : 404

  return Response.json(result, { status })
}
