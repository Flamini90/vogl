"use client"

import { useState } from "react"
import { Bluetooth, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { Elm327Client } from "@/lib/obd/elm327"
import { isWebBluetoothAvailable, ObdError, type ObdReading } from "@/lib/obd/types"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function ObdSheet({
  open,
  onOpenChange,
  onReading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReading: (reading: ObdReading) => void
}) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("Avvicina lo scanner BLE e tocca Connetti.")
  const supported = isWebBluetoothAvailable()

  async function connect() {
    const client = new Elm327Client()
    setBusy(true)

    try {
      setStatus("Seleziona lo scanner OBD...")
      const name = await client.connect()
      setStatus(`Connesso a ${name}. Lettura VIN e chilometri...`)
      const reading = await client.readVehicle()
      onReading(reading)
      toast.success("Lettura OBD completata")
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof ObdError
          ? error.message
          : "Connessione non riuscita. Serve un adattatore Bluetooth Low Energy e Chrome su Android o desktop."
      setStatus(message)
      toast.error(message)
    } finally {
      await client.disconnect().catch(() => undefined)
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle>Scanner OBD</SheetTitle>
          <SheetDescription>
            VOGL legge VIN e, se la centralina lo espone, i chilometri via ELM327 BLE.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <p className="text-sm leading-6">{status}</p>
          {!supported ? (
            <p className="text-muted-foreground text-sm leading-6">
              Web Bluetooth non è disponibile qui. Su iPhone Safari non è supportato: usa Chrome
              su Android oppure inserisci i dati a mano.
            </p>
          ) : null}
        </div>
        <SheetFooter>
          <Button className="h-11 w-full" disabled={!supported || busy} onClick={() => void connect()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Bluetooth />}
            Connetti scanner
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
