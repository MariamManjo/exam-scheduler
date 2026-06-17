import type { AppStep } from '../../types/upload'

const STEPS: { id: AppStep; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'review', label: 'Review' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'results', label: 'Results' },
]

interface StepIndicatorProps {
  currentStep: AppStep
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep)

  return (
    <nav aria-label="Progress" className="mb-10 sm:mb-12">
      <ol className="flex items-center justify-center gap-2 sm:gap-3">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = step.id === currentStep

          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isComplete
                      ? 'bg-accent text-white'
                      : isCurrent
                        ? 'bg-accent text-white ring-4 ring-accent/15'
                        : 'bg-muted text-subtle',
                  ].join(' ')}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span
                  className={[
                    'hidden text-sm font-medium sm:inline',
                    isCurrent ? 'text-ink' : 'text-subtle',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  className={[
                    'h-px w-6 sm:w-10',
                    isComplete ? 'bg-accent' : 'bg-border',
                  ].join(' ')}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
