export function formatMMSS(totalSec: number): string {
  const sign = totalSec < 0 ? "-" : "";
  const abs = Math.abs(Math.floor(totalSec));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatHMSorMMSS(totalSec: number): string {
  const abs = Math.abs(Math.floor(totalSec));
  const h = Math.floor(abs / 3600);
  if (h === 0) return formatMMSS(totalSec);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const sign = totalSec < 0 ? "-" : "";
  return `${sign}${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function elapsedSec(startedAt: number | null, now: number): number {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function secToMinLabel(sec: number): string {
  const m = Math.floor(sec / 60);
  return `min ${m}`;
}
