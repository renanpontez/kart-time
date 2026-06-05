"use client";

import { useRaceStore, elapsedFromState } from "@/lib/store";
import { computeCompliance, projectedFinalSec } from "@/lib/race-rules";
import { useTick } from "./use-tick";
import { formatMMSS } from "@/lib/time";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComplianceBanner() {
  const status = useRaceStore((s) => s.status);
  const startedAt = useRaceStore((s) => s.startedAt);
  const finishedAt = useRaceStore((s) => s.finishedAt);
  const penaltySec = useRaceStore((s) => s.penaltySec);
  const fullState = useRaceStore((s) => s);
  const now = useTick(500);
  const elapsed = elapsedFromState({ status, startedAt, finishedAt }, now);
  const compliance = computeCompliance(fullState, elapsed);
  const finalSec = projectedFinalSec(fullState, elapsed);

  const Icon =
    compliance.level === "ok"
      ? CheckCircle2
      : compliance.level === "warn"
      ? AlertTriangle
      : ShieldAlert;

  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b backdrop-blur",
        compliance.level === "ok" && "bg-emerald-950/60 border-emerald-900 text-emerald-200",
        compliance.level === "warn" && "bg-amber-950/60 border-amber-900 text-amber-200",
        compliance.level === "violation" && "bg-red-950/70 border-red-900 text-red-200",
      )}
    >
      <div className="mx-auto max-w-7xl flex items-center gap-3 px-4 py-2 text-sm">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {compliance.messages.length === 0 ? (
            <span>All clear.</span>
          ) : (
            <span className="truncate">{compliance.messages.join(" · ")}</span>
          )}
        </div>
        <div className="text-xs font-mono tabular-nums whitespace-nowrap">
          Penalty: +{penaltySec}s &nbsp;·&nbsp; Projected: {formatMMSS(finalSec)}
        </div>
      </div>
    </div>
  );
}
