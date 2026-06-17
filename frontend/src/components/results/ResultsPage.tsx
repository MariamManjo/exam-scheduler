import { formatDisplayDate } from '../../lib/format'
import type { ScheduleResponse } from '../../types/schedule'
import type { ScheduleRange } from '../schedule/SchedulePage'
import { PageHeader } from '../layout/PageHeader'
import { ScheduleResultsList } from './ScheduleResultsList'

interface ResultsPageProps {
  result: ScheduleResponse
  range: ScheduleRange
  onBack: () => void
}

export function ResultsPage({ result, range, onBack }: ResultsPageProps) {
  const topCount = result.best_windows.length

  return (
    <div>
      <PageHeader
        eyebrow="Step 4"
        title="Schedule results"
        description="Top lecture windows ranked by how many students are available, based on your reviewed exam data."
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">Students</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{result.total_students}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">Windows</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{topCount}</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-subtle">Date range</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatDisplayDate(range.startDate)} — {formatDisplayDate(range.endDate)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Top {topCount} lecture windows
            </h2>
            <p className="mt-1 text-sm text-subtle">
              Sorted by highest student availability within university hours.
            </p>
          </div>
        </div>

        <ScheduleResultsList result={result} />

        <div className="mt-8 border-t border-border pt-6">
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border border-border px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-muted/60"
          >
            Adjust dates & regenerate
          </button>
        </div>
      </section>
    </div>
  )
}
