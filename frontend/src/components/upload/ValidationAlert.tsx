interface ValidationAlertProps {
  errors: string[]
}

export function ValidationAlert({ errors }: ValidationAlertProps) {
  if (errors.length === 0) return null

  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">Some files could not be added</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
