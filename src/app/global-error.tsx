"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#12100e",
          color: "#f4f1ea",
          fontFamily: "sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <main style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ letterSpacing: "0.2em", fontSize: 12, opacity: 0.7 }}>VOGL</p>
          <h1 style={{ fontSize: 28, margin: "12px 0" }}>Pagina non disponibile</h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
            C&apos;è stato un problema al primo avvio. Riprova, i dati locali non vengono cancellati.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 20,
              border: 0,
              borderRadius: 12,
              padding: "12px 20px",
              background: "#e8b86d",
              color: "#12100e",
              fontWeight: 600,
            }}
          >
            Riprova
          </button>
        </main>
      </body>
    </html>
  )
}
