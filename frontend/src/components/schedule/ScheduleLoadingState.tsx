export function ScheduleLoadingState() {
  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="mb-5 size-10 animate-spin rounded-full border-[3px] border-accent/20 border-t-accent" />
        <h2 className="text-lg font-semibold text-ink">Generating schedule</h2>
        <p className="mt-2 max-w-md text-sm text-subtle">
          Analyzing exam conflicts and ranking the best 3-hour lecture windows…
        </p>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-border bg-muted/50"
          />
        ))}
      </div>
    </section>
  )
}
