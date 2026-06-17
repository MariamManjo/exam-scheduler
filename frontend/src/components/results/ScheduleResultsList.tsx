import type { ScheduleResponse } from '../../types/schedule'
import { ScheduleResultCard } from './ScheduleResultCard'

interface ScheduleResultsListProps {
  result: ScheduleResponse
}

export function ScheduleResultsList({ result }: ScheduleResultsListProps) {
  const ranked = result.best_windows.map((window, index) => ({
    ...window,
    rank: index + 1,
  }))

  if (ranked.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-12 text-center text-sm text-subtle">
        No lecture windows found for the selected date range.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {ranked.map((window) => (
        <ScheduleResultCard
          key={`${window.rank}-${window.date}-${window.start_time}`}
          window={window}
          totalStudents={result.total_students}
        />
      ))}
    </div>
  )
}
