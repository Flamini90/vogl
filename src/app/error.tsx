"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("VOGL route error")
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">VOGL</p>
      <h1 className="font-heading text-3xl">Qualcosa è andato storto</h1>
      <p className="text-muted-foreground max-w-sm text-sm leading-6">
        Ricarica la pagina. I tuoi veicoli restano salvati su questo dispositivo.
      </p>
      <Button className="h-11 px-6" onClick={() => reset()}>
        Riprova
      </Button>
    </div>
  )
}
