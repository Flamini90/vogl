import { generatePortalCaptcha } from "@/lib/lookup/portal"

export const dynamic = "force-dynamic"

export async function GET() {
  const result = await generatePortalCaptcha()
  return Response.json(result, { status: "id" in result && "imageBase64" in result ? 200 : 502 })
}