interface ErrorAlertProps {
  message: string
  title?: string
}

export function ErrorAlert({ message, title = 'Something went wrong' }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  )
}
