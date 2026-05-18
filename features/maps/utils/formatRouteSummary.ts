export function formatRouteSummary(distanceKm: number, durationMin: number): string {
  const km =
    distanceKm >= 100
      ? `${Math.round(distanceKm)}km`
      : `${distanceKm.toFixed(1)}km`;
  return `${km} drive · ${durationMin} min`;
}
