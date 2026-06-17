interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
}

function DateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string
  label: string
  value: string
  min?: string
  max?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink shadow-sm outline-none transition-[box-shadow,border-color] focus:border-accent focus:ring-4 focus:ring-accent/10"
      />
    </div>
  )
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Scheduling period</h2>
        <p className="mt-1 text-sm text-subtle">
          Choose the date range to search for optimal 3-hour lecture windows.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <DateField
          id="start-date"
          label="Start Date"
          value={startDate}
          max={endDate || undefined}
          onChange={onStartDateChange}
        />
        <DateField
          id="end-date"
          label="End Date"
          value={endDate}
          min={startDate || undefined}
          onChange={onEndDateChange}
        />
      </div>
    </section>
  )
}
