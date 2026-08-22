# VOGL

**Vehicle Oversight, Garage & Lifecycle**

Webapp mobile-first per la gestione completa della manutenzione dei veicoli: anagrafica dalla targa, chilometri dallo scanner OBD, diario di rifornimenti e spese, cicli ordinari e notifiche di rinnovo.

## Perché costa zero

- Hosting: [Vercel Hobby](https://vercel.com) è gratuito.
- Dati: restano nel browser (IndexedDB). Nessun database, nessun account, nessuna API a pagamento obbligatoria.
- VIN: decodifica via [CarAPI.dev](https://docs.carapi.dev/endpoints/vin-decode); se manca il modello, fallback gratuito [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/).
- Targa: in Italia non esiste un'anagrafe pubblica gratuita. Senza variabili d'ambiente VOGL passa automaticamente a OBD o inserimento manuale.
- Notifiche: Web Notification + service worker, senza provider push a pagamento.

## Avvio locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Deploy su Vercel

1. Carica il repo su GitHub oppure usa `npx vercel`.
2. Framework preset: Next.js.
3. Nessuna variabile obbligatoria.

### Ricerca targa opzionale

Se un giorno vuoi un'anagrafe targa (servizi italiani a consumo), imposta:

```
PLATE_LOOKUP_ENDPOINT=https://esempio/api/{plate}
PLATE_LOOKUP_TOKEN=il_tuo_token
```

VOGL chiama l'endpoint sostituendo `{plate}` e mappa marca, modello, anno, alimentazione e VIN se presenti. Senza queste variabili il costo resta 0.

## Scanner OBD

Serve un adattatore **ELM327 Bluetooth Low Energy** e un browser con Web Bluetooth (Chrome/Edge su Android o desktop). I dongle Bluetooth classici (SPP) non sono visibili dal browser.

Dallo scanner VOGL tenta:

- VIN (`0902`)
- Chilometri (`01A6`, se la centralina li espone)

Se i km non arrivano, li inserisci a mano. Il VIN viene decodificato per marca, modello, anno e alimentazione.

## Diario

Nel dettaglio veicolo, la scheda **Diario** registra rifornimenti (o ricariche), chilometri, interventi e spese. Due pieni consecutivi calcolano il consumo medio (L/100 km o kWh/100 km). I costi restano sul dispositivo e finiscono nel backup JSON.

## Notifiche

Da Impostazioni attiva le notifiche e, se possibile, installa VOGL come app (PWA). I reminder vengono valutati all'apertura e, su Chrome Android, anche in background con Periodic Background Sync.

## Stack

Next.js, Tailwind CSS, shadcn/ui, Dexie. Codice organizzato per dominio (`lib/domain`), persistenza (`lib/db`), lookup, OBD, diario e notifiche, senza duplicare le regole di scadenza.
