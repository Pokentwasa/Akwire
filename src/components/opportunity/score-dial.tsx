export function ScoreDial({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-border bg-surface p-4">
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-center text-xs text-ink-muted">{label}</p>
    </div>
  );
}
