import { VehicleEditView } from "@/components/views/vehicle-edit-view"

export default async function VehicleEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <VehicleEditView id={id} />
}
