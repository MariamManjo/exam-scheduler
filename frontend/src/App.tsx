import { useState } from 'react'
import { ResultsPage } from './components/results/ResultsPage'
import { ReviewPage } from './components/review/ReviewPage'
import type { ScheduleRange } from './components/schedule/SchedulePage'
import { SchedulePage } from './components/schedule/SchedulePage'
import { ImageUploadPage } from './components/upload/ImageUploadPage'
import { StepIndicator } from './components/layout/StepIndicator'
import { useUploadedImages } from './hooks/useUploadedImages'
import type { ScheduleResponse } from './types/schedule'
import type { AppStep, ExtractedStudent } from './types/upload'

export default function App() {
  const [step, setStep] = useState<AppStep>('upload')
  const [extractedStudents, setExtractedStudents] = useState<ExtractedStudent[]>([])
  const [scheduleResult, setScheduleResult] = useState<ScheduleResponse | null>(null)
  const [scheduleRange, setScheduleRange] = useState<ScheduleRange | null>(null)
  const upload = useUploadedImages()

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="mb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          AI Lecture Scheduler
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {step === 'upload' && (
        <ImageUploadPage
          upload={upload}
          onComplete={(students) => {
            setExtractedStudents(students)
            setStep('review')
          }}
        />
      )}

      {step === 'review' && (
        <ReviewPage
          initialStudents={extractedStudents}
          onBack={() => setStep('upload')}
          onContinue={(students) => {
            setExtractedStudents(students)
            setScheduleResult(null)
            setStep('schedule')
          }}
        />
      )}

      {step === 'schedule' && (
        <SchedulePage
          students={extractedStudents}
          initialRange={scheduleRange ?? undefined}
          onBack={() => setStep('review')}
          onComplete={(result, range) => {
            setScheduleResult(result)
            setScheduleRange(range)
            setStep('results')
          }}
        />
      )}

      {step === 'results' && scheduleResult && scheduleRange && (
        <ResultsPage
          result={scheduleResult}
          range={scheduleRange}
          students={extractedStudents}
          onBack={() => setStep('schedule')}
        />
      )}
    </div>
  )
}
