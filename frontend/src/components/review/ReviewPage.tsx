import { useStudentReview } from '../../hooks/useStudentReview'
import {
  SCHEDULE_VALIDATION_MESSAGE,
  studentsHaveValidExams,
} from '../../lib/examValidation'
import type { ExtractedStudent } from '../../types/upload'
import { PageHeader } from '../layout/PageHeader'
import { ReviewSummary, StudentReviewCard } from './StudentReviewCard'

interface ReviewPageProps {
  initialStudents: ExtractedStudent[]
  onBack: () => void
  onContinue: (students: ExtractedStudent[]) => void
}

export function ReviewPage({ initialStudents, onBack, onContinue }: ReviewPageProps) {
  const {
    students,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    setName,
    editExam,
    removeExam,
    createExam,
    removeStudent,
  } = useStudentReview(initialStudents)

  const hasValidExams = studentsHaveValidExams(students)
  const canContinue =
    students.length > 0 &&
    students.every((student) => student.name.trim()) &&
    hasValidExams

  return (
    <div>
      <PageHeader
        eyebrow="Step 2"
        title="Review extracted data"
        description="Review and edit extracted student names, subjects, and exam times before scheduling."
      />

      <div className="mb-6">
        <ReviewSummary students={students} />
      </div>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Students</h2>
            <p className="mt-1 text-sm text-subtle">
              Expand a card to edit exams or update details.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-muted/60"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-xl border border-border px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-muted/60"
            >
              Collapse all
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-12 text-center text-sm text-subtle">
            No students extracted. Go back and upload images again.
          </p>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <StudentReviewCard
                key={student.id}
                student={student}
                isExpanded={expandedIds.has(student.id)}
                onToggle={() => toggleExpanded(student.id)}
                onNameChange={(name) => setName(student.id, name)}
                onExamChange={(examId, patch) => editExam(student.id, examId, patch)}
                onExamDelete={(examId) => removeExam(student.id, examId)}
                onExamAdd={() => createExam(student.id, student.sourceImageId)}
                onStudentDelete={() => removeStudent(student.id)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl border border-border px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-muted/60"
          >
            Back to upload
          </button>

          <div className="flex flex-col gap-2 sm:items-end">
            {!canContinue && students.length > 0 && (
              <p className="text-xs text-subtle">
                {!hasValidExams
                  ? SCHEDULE_VALIDATION_MESSAGE
                  : 'Every student needs a name before continuing.'}
              </p>
            )}
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => onContinue(students)}
              className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to schedule
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
