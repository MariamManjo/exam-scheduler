import { isValidIsoDate, isValidTime } from '../../lib/examValidation'
import { formatDisplayDate, formatTime } from '../../lib/format'
import type { ExtractedExam } from '../../types/upload'

interface ExamEditorProps {
  exam: ExtractedExam
  index: number
  onChange: (patch: { subject?: string; date?: string | null; time?: string }) => void
  onDelete: () => void
}

export function ExamEditor({ exam, index, onChange, onDelete }: ExamEditorProps) {
  const dateInputValue = isValidIsoDate(exam.date) ? (exam.date as string) : ''
  const timeInputValue = isValidTime(exam.time) ? exam.time : ''

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
          Exam {index + 1}
        </p>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Delete exam
        </button>
      </div>

      <div className="space-y-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Subject</span>
          <input
            type="text"
            value={exam.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            placeholder="Exam subject"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-[box-shadow,border-color] focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Date</span>
          <input
            type="date"
            value={dateInputValue}
            onChange={(e) => onChange({ date: e.target.value || null })}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-[box-shadow,border-color] focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          <span className="text-xs text-subtle">{formatDisplayDate(exam.date)}</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Start time</span>
          <input
            type="time"
            value={timeInputValue}
            onChange={(e) => onChange({ time: e.target.value })}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-[box-shadow,border-color] focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          <span className="text-xs text-subtle">{formatTime(exam.time)}</span>
        </label>
        </div>
      </div>
    </div>
  )
}
