import { countExams } from '../../lib/students'
import type { ExtractedStudent } from '../../types/upload'
import { ExamEditor } from './ExamEditor'

interface StudentReviewCardProps {
  student: ExtractedStudent
  isExpanded: boolean
  onToggle: () => void
  onNameChange: (name: string) => void
  onExamChange: (
    examId: string,
    patch: { subject?: string; date?: string | null; time?: string },
  ) => void
  onExamDelete: (examId: string) => void
  onExamAdd: () => void
  onStudentDelete: () => void
}

export function StudentReviewCard({
  student,
  isExpanded,
  onToggle,
  onNameChange,
  onExamChange,
  onExamDelete,
  onExamAdd,
  onStudentDelete,
}: StudentReviewCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        aria-expanded={isExpanded}
      >
        <span
          className={[
            'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold',
            isExpanded ? 'bg-accent text-white' : 'bg-muted text-ink',
          ].join(' ')}
        >
          {student.name.trim().charAt(0).toUpperCase() || '?'}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink">{student.name || 'Unnamed student'}</p>
          <p className="mt-0.5 text-sm text-subtle">
            {student.exams.length} exam{student.exams.length === 1 ? '' : 's'}
          </p>
        </div>

        <svg
          className={[
            'size-5 shrink-0 text-subtle transition-transform',
            isExpanded ? 'rotate-180' : '',
          ].join(' ')}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-5 py-5 sm:px-6 sm:py-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex flex-1 flex-col gap-2">
              <span className="text-sm font-medium text-ink">Student name</span>
              <input
                type="text"
                value={student.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter student name"
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-[box-shadow,border-color] focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>
            <button
              type="button"
              onClick={onStudentDelete}
              className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Remove student
            </button>
          </div>

          <div className="space-y-4">
            {student.exams.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-subtle">
                No exams for this student. Add one below.
              </p>
            ) : (
              student.exams.map((exam, index) => (
                <ExamEditor
                  key={exam.id}
                  exam={exam}
                  index={index}
                  onChange={(patch) => onExamChange(exam.id, patch)}
                  onDelete={() => onExamDelete(exam.id)}
                />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={onExamAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted/60"
          >
            <span className="text-lg leading-none">+</span>
            Add exam
          </button>
        </div>
      )}
    </article>
  )
}

export function ReviewSummary({ students }: { students: ExtractedStudent[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">Students</p>
        <p className="mt-1 text-2xl font-semibold text-ink">{students.length}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">Exams</p>
        <p className="mt-1 text-2xl font-semibold text-ink">{countExams(students)}</p>
      </div>
      <div className="col-span-2 rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm sm:col-span-1">
        <p className="text-xs font-medium uppercase tracking-wider text-subtle">Status</p>
        <p className="mt-1 text-sm font-semibold text-accent">Ready for review</p>
      </div>
    </div>
  )
}
