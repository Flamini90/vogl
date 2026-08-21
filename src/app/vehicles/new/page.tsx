import { PageHeader } from "@/components/layout/page-header"
import { AddVehicleFlow } from "@/components/onboarding/add-vehicle-flow"

export default function NewVehiclePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Nuovo veicolo"
        title="Dalla targa"
        description="VOGL cerca l'anagrafica. Se non è disponibile, passa allo scanner OBD o all'inserimento manuale."
      />
      <AddVehicleFlow />
    </div>
  )
}
