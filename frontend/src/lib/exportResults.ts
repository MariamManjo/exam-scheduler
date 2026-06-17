import * as XLSX from 'xlsx'
import { formatDisplayDate, formatTime } from './format'
import type { ScheduleResponse } from '../types/schedule'
import type { ExtractedStudent } from '../types/upload'
import type { ScheduleRange } from '../components/schedule/SchedulePage'

export interface ExportContext {
  result: ScheduleResponse
  range: ScheduleRange
  students: ExtractedStudent[]
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function availabilityPercent(available: number, total: number): number {
  return total ? Math.round((available / total) * 100) : 0
}

function rankedWindows(result: ScheduleResponse) {
  return result.best_windows.map((window, index) => ({
    ...window,
    rank: index + 1,
    availability: availabilityPercent(window.available_students, result.total_students),
  }))
}

function escapeCsv(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function buildShareableReport({ result, range, students }: ExportContext): string {
  const windows = rankedWindows(result)
  const topTwo = windows.slice(0, 2)
  const generatedAt = new Date().toLocaleString('en-GB', { hour12: false })
  const lines: string[] = [
    'AI Lecture Scheduler — Lecturer Report',
    '====================================',
    '',
    `Generated: ${generatedAt}`,
    `Students reviewed: ${result.total_students}`,
    `Search range: ${formatDisplayDate(range.startDate)} to ${formatDisplayDate(range.endDate)}`,
    '',
    'RECOMMENDED 3-HOUR SESSION SLOTS',
    '--------------------------------',
  ]

  if (topTwo.length === 0) {
    lines.push('No suitable lecture windows were found in the selected date range.')
  } else {
    topTwo.forEach((window) => {
      lines.push(
        `${window.rank}. ${formatDisplayDate(window.date)} · ${formatTime(window.start_time)}–${formatTime(window.end_time)} · ${window.available_students}/${result.total_students} students available (${window.availability}%)`,
      )
    })
  }

  lines.push('', 'ALL RANKED LECTURE WINDOWS', '--------------------------')
  if (windows.length === 0) {
    lines.push('None')
  } else {
    windows.forEach((window) => {
      lines.push(
        `#${window.rank} ${formatDisplayDate(window.date)} ${formatTime(window.start_time)}-${formatTime(window.end_time)} · ${window.available_students}/${result.total_students} (${window.availability}%)`,
      )
    })
  }

  lines.push('', 'STUDENT EXAM SUMMARY', '--------------------')
  students.forEach((student, index) => {
    lines.push(`${index + 1}. ${student.name || `Student ${index + 1}`}`)
    if (student.exams.length === 0) {
      lines.push('   No exams recorded')
    } else {
      student.exams.forEach((exam) => {
        lines.push(
          `   - ${exam.subject || 'Untitled exam'} · ${formatDisplayDate(exam.date)} · ${formatTime(exam.time)}`,
        )
      })
    }
  })

  lines.push('', 'Notes:', '- Lecture windows are 3 hours within 09:00–21:00.')
  lines.push('- Exam conflicts use a 90-minute block from each exam start time.')
  lines.push('- Please confirm the top two slots with the class before final booking.')

  return lines.join('\n')
}

export function exportResultsCsv(context: ExportContext) {
  const windows = rankedWindows(context.result)
  const header = [
    'Rank',
    'Date',
    'Start Time',
    'End Time',
    'Available Students',
    'Total Students',
    'Availability %',
  ]

  const rows = windows.map((window) => [
    window.rank,
    window.date,
    window.start_time,
    window.end_time,
    window.available_students,
    context.result.total_students,
    window.availability,
  ])

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'lecture-schedule-results.csv')
}

export function exportResultsExcel(context: ExportContext) {
  const windows = rankedWindows(context.result)
  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['AI Lecture Scheduler Results'],
    ['Generated', new Date().toISOString()],
    ['Total students', context.result.total_students],
    ['Range start', context.range.startDate],
    ['Range end', context.range.endDate],
    [],
    ['Recommended slot 1'],
    ...(windows[0]
      ? [
          ['Date', windows[0].date],
          ['Start', windows[0].start_time],
          ['End', windows[0].end_time],
          ['Available', windows[0].available_students],
          ['Availability %', windows[0].availability],
        ]
      : [['None']]),
    [],
    ['Recommended slot 2'],
    ...(windows[1]
      ? [
          ['Date', windows[1].date],
          ['Start', windows[1].start_time],
          ['End', windows[1].end_time],
          ['Available', windows[1].available_students],
          ['Availability %', windows[1].availability],
        ]
      : [['None']]),
  ])
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  const windowsSheet = XLSX.utils.json_to_sheet(
    windows.map((window) => ({
      Rank: window.rank,
      Date: window.date,
      'Start Time': window.start_time,
      'End Time': window.end_time,
      'Available Students': window.available_students,
      'Total Students': context.result.total_students,
      'Availability %': window.availability,
    })),
  )
  XLSX.utils.book_append_sheet(workbook, windowsSheet, 'Lecture Windows')

  const examsSheet = XLSX.utils.json_to_sheet(
    context.students.flatMap((student, studentIndex) =>
      student.exams.map((exam) => ({
        Student: student.name || `Student ${studentIndex + 1}`,
        Subject: exam.subject,
        Date: exam.date ?? '',
        Time: exam.time,
      })),
    ),
  )
  XLSX.utils.book_append_sheet(workbook, examsSheet, 'Student Exams')

  XLSX.writeFile(workbook, 'lecture-schedule-results.xlsx')
}

export function exportShareableReport(context: ExportContext) {
  const report = buildShareableReport(context)
  downloadBlob(
    new Blob([report], { type: 'text/plain;charset=utf-8' }),
    'lecture-schedule-for-lecturer.txt',
  )
}
