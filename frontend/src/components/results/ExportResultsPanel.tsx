import {
  exportResultsCsv,
  exportResultsExcel,
  exportShareableReport,
  type ExportContext,
} from '../../lib/exportResults'

interface ExportResultsPanelProps {
  context: ExportContext
}

export function ExportResultsPanel({ context }: ExportResultsPanelProps) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Export & share</h2>
        <p className="mt-1 text-sm text-subtle">
          Download the schedule for your records or send the lecturer report directly.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => exportResultsCsv(context)}
          className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted/60"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => exportResultsExcel(context)}
          className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted/60"
        >
          Export Excel
        </button>
        <button
          type="button"
          onClick={() => exportShareableReport(context)}
          className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover"
        >
          Download lecturer report
        </button>
      </div>
    </section>
  )
}
