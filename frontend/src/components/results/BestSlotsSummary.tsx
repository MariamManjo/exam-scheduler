import type { ScheduleResponse } from '../../types/schedule'
import { formatDisplayDate, formatTime } from '../../lib/format'

interface BestSlotsSummaryProps {
  result: ScheduleResponse
}

export function BestSlotsSummary({ result }: BestSlotsSummaryProps) {
  const topTwo = result.best_windows.slice(0, 2)

  if (topTwo.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-border bg-muted/20 p-6 text-sm text-subtle sm:p-8">
        No lecture windows were found for the selected date range.
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-accent/20 bg-accent/5 p-6 shadow-sm sm:p-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Recommended for the lecturer
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
          Best two 3-hour session slots
        </h2>
        <p className="mt-1 text-sm text-subtle">
          These windows have the highest student availability based on the reviewed exam timetable.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {topTwo.map((window, index) => {
          const availability = result.total_students
            ? Math.round((window.available_students / result.total_students) * 100)
            : 0

          return (
            <article
              key={`${window.date}-${window.start_time}`}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Slot {index + 1}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {formatDisplayDate(window.date)}
              </p>
              <p className="mt-1 text-sm text-ink">
                {formatTime(window.start_time)} – {formatTime(window.end_time)}
              </p>
              <p className="mt-4 text-sm text-subtle">
                <span className="font-semibold text-ink">{window.available_students}</span> of{' '}
                <span className="font-semibold text-ink">{result.total_students}</span> students
                available
              </p>
              <p className="mt-1 text-2xl font-semibold text-accent">{availability}%</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
