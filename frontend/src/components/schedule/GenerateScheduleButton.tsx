interface GenerateScheduleButtonProps {
  disabled?: boolean
  isLoading?: boolean
  onClick: () => void
}

export function GenerateScheduleButton({
  disabled,
  isLoading,
  onClick,
}: GenerateScheduleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-64"
    >
      {isLoading ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Generating schedule…
        </>
      ) : (
        'Generate Schedule'
      )}
    </button>
  )
}
