# Kart-Time — Endurance Monaco 2026

Personal race console for our 2-driver team (Renan + Bruno). One page, local-only,
zero sign-in. Designed for tablet/laptop pit use.

Built straight from the EDITAL ENDURANCE MONACO 2026 rulebook (the PDF is in the repo root).

## What it tracks

- 60-minute race clock (resumes from `localStorage` after reload)
- Three mandatory stints with active driver + Joker-Lap state
- Two driver-change windows (min 18-20 / 38-40) — Art. 3a
- Two refuel windows derived from your team number (Art. 11 cronograma)
- Auto +120s penalty when an action lands outside its window (Art. 3b / Art. 4)
- Driver-change-during-refuel block (Art. 4d → DSQ guard)
- Same-driver consecutive-stint block (Art. 1d → DSQ guard)
- Manual penalty entry, event log, projected final time

## Setup

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (run before pushing)
```

Open the **Setup** dialog (top-right) and pick your team number (1–10). Refuel
windows recalculate automatically.

## Deploy

```bash
npx vercel deploy --prod
```

No env vars, no backend, no DB. Vercel auto-detects Next.js.

## State persistence

Everything lives in `localStorage` under `kart-time-race`. Refresh-safe.
"New Race" wipes the run but preserves team + driver config.

## Stack

Next.js 16 · React 19.2 · Tailwind v4 · Zustand · Radix primitives · lucide-react
