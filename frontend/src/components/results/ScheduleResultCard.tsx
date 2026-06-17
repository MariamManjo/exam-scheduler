import type { RankedWindow } from '../../types/schedule'
import { formatDisplayDate, formatTime, rankLabel } from '../../lib/format'

interface ScheduleResultCardProps {
  window: RankedWindow
  totalStudents: number
}

export function ScheduleResultCard({ window, totalStudents }: ScheduleResultCardProps) {
  const availability = totalStudents
    ? Math.round((window.available_students / totalStudents) * 100)
    : 0

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={[
              'flex size-11 items-center justify-center rounded-xl text-xl',
              window.rank <= 3 ? 'bg-accent/10' : 'bg-muted',
            ].join(' ')}
            aria-label={`Rank ${window.rank}`}
          >
            {rankLabel(window.rank)}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">Ranking</p>
            <p className="text-lg font-semibold text-ink">#{window.rank}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">Availability</p>
          <p className="text-lg font-semibold text-accent">{availability}%</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-subtle">Date</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{formatDisplayDate(window.date)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-subtle">Start time</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{formatTime(window.start_time)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-subtle">End time</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{formatTime(window.end_time)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-subtle">
            Available students
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {window.available_students}
            <span className="font-normal text-subtle"> / {totalStudents}</span>
          </dd>
        </div>
      </dl>
    </article>
  )
}
