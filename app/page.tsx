"use client";

import { useEffect, useState } from "react";
import { useRaceStore } from "@/lib/store";
import { RaceClock } from "@/components/race-clock";
import { StintCard } from "@/components/stint-card";
import { WindowStatus } from "@/components/window-status";
import { ActionPanel } from "@/components/action-panel";
import { EventLog } from "@/components/event-log";
import { ComplianceBanner } from "@/components/compliance-banner";
import { SetupDialog } from "@/components/setup-dialog";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const teamNumber = useRaceStore((s) => s.config.teamNumber);
  const status = useRaceStore((s) => s.status);

  // Avoid SSR/CSR mismatch — Zustand persist hydrates after mount.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center text-zinc-500">
        Loading…
      </main>
    );
  }

  return (
    <>
      <ComplianceBanner />
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <header className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-wider uppercase">Kart-Time</h1>
          <span className="text-zinc-500 text-xs uppercase tracking-widest hidden sm:inline">
            Endurance Monaco 2026
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline">Team #{teamNumber}</Badge>
            <Badge
              variant={
                status === "running" ? "ok" : status === "finished" ? "danger" : "default"
              }
            >
              {status}
            </Badge>
            <SetupDialog />
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
            <RaceClock />
          </div>
          <div className="lg:col-span-1">
            <StintCard />
          </div>
        </section>

        <section>
          <WindowStatus />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EventLog />
          </div>
          <div className="lg:col-span-1">
            <ActionPanel />
          </div>
        </section>

        <footer className="text-xs text-zinc-600 pt-4 pb-12 text-center">
          Personal race console · Local-only · Penalties auto-logged per the edital
        </footer>
      </main>
    </>
  );
}
