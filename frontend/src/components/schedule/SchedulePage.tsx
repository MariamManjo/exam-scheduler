import { useMemo, useState } from 'react'
import { calculateSchedule, ScheduleApiError } from '../../api/schedule'
import {
  SCHEDULE_VALIDATION_MESSAGE,
  studentsHaveValidExams,
} from '../../lib/examValidation'
import { toApiStudents } from '../../lib/students'
import type { ScheduleResponse } from '../../types/schedule'
import type { ExtractedStudent } from '../../types/upload'
import { ErrorAlert } from '../layout/ErrorAlert'
import { PageHeader } from '../layout/PageHeader'
import { DateRangePicker } from '../DateRangePicker'
import { GenerateScheduleButton } from './GenerateScheduleButton'
import { ScheduleLoadingState } from './ScheduleLoadingState'

function defaultStartDate() {
  return new Date().toISOString().slice(0, 10)
}

function defaultEndDate() {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().slice(0, 10)
}

export interface ScheduleRange {
  startDate: string
  endDate: string
}

interface SchedulePageProps {
  students: ExtractedStudent[]
  initialRange?: ScheduleRange
  onBack: () => void
  onComplete: (result: ScheduleResponse, range: ScheduleRange) => void
}

export function SchedulePage({
  students,
  initialRange,
  onBack,
  onComplete,
}: SchedulePageProps) {
  const [startDate, setStartDate] = useState(initialRange?.startDate ?? defaultStartDate)
  const [endDate, setEndDate] = useState(initialRange?.endDate ?? defaultEndDate)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasValidExams = useMemo(() => studentsHaveValidExams(students), [students])

  const canGenerate = useMemo(
    () =>
      Boolean(
        startDate &&
          endDate &&
          startDate <= endDate &&
          students.length > 0 &&
          hasValidExams,
      ),
    [startDate, endDate, students.length, hasValidExams],
  )

  const handleGenerate = async () => {
    if (!canGenerate || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await calculateSchedule({
        students: toApiStudents(students),
        start_date: startDate,
        end_date: endDate,
      })

      onComplete(response, { startDate, endDate })
    } catch (err) {
      if (err instanceof ScheduleApiError) {
        setError(err.message)
      } else if (err instanceof TypeError) {
        setError('Unable to reach the scheduling API. Run `npm run dev` from the project root.')
      } else {
        setError('Failed to generate the schedule. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Step 3"
        title="Configure schedule"
        description={`Choose a date range, then generate the best lecture windows for ${students.length} reviewed student${students.length === 1 ? '' : 's'}.`}
      />

      <main className="space-y-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {isLoading ? (
          <ScheduleLoadingState />
        ) : (
          <>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onBack}
                className="rounded-2xl border border-border px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-muted/60"
              >
                Back to review
              </button>
              <GenerateScheduleButton
                disabled={!canGenerate}
                isLoading={isLoading}
                onClick={handleGenerate}
              />
            </div>

            {error && <ErrorAlert message={error} title="Schedule generation failed" />}

            {!hasValidExams && students.length > 0 && (
              <ErrorAlert
                title="Invalid exam data"
                message={SCHEDULE_VALIDATION_MESSAGE}
              />
            )}

            {!canGenerate && students.length === 0 && (
              <ErrorAlert
                title="No students available"
                message="Go back to review and make sure at least one student is included."
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
