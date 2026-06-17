export interface Exam {
  date: string
  time: string
}

export interface Student {
  name: string
  exams: Exam[]
}

export interface LectureWindow {
  date: string
  start_time: string
  end_time: string
  available_students: number
}

export interface ScheduleResponse {
  total_students: number
  best_windows: LectureWindow[]
}

const WORK_START_MINUTES = 9 * 60
const WORK_END_MINUTES = 21 * 60
const LECTURE_DURATION_MINUTES = 3 * 60
const EXAM_DURATION_MINUTES = 90
const WINDOW_STEP_MINUTES = 30
const TOP_N = 10

interface TimeInterval {
  startMs: number
  endMs: number
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function parseTime(value: string): { hours: number; minutes: number } {
  for (const fmt of [/^(\d{1,2}):(\d{2})$/, /^(\d{1,2}):(\d{2}):(\d{2})$/]) {
    const match = value.match(fmt)
    if (match) {
      return { hours: Number(match[1]), minutes: Number(match[2]) }
    }
  }
  throw new Error(`Invalid time format: ${value}`)
}

function combineUtc(dateValue: Date, hours: number, minutes: number): number {
  return Date.UTC(
    dateValue.getUTCFullYear(),
    dateValue.getUTCMonth(),
    dateValue.getUTCDate(),
    hours,
    minutes,
  )
}

function addDays(dateValue: Date, days: number): Date {
  const next = new Date(dateValue)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function formatDate(dateValue: Date): string {
  const year = dateValue.getUTCFullYear()
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.startMs < b.endMs && a.endMs > b.startMs
}

function* iterDates(start: Date, end: Date): Generator<Date> {
  let current = start
  while (current.getTime() <= end.getTime()) {
    yield current
    current = addDays(current, 1)
  }
}

function* generateDailyWindows(day: Date): Generator<TimeInterval> {
  const latestStart = WORK_END_MINUTES - LECTURE_DURATION_MINUTES

  for (
    let startMinutes = WORK_START_MINUTES;
    startMinutes <= latestStart;
    startMinutes += WINDOW_STEP_MINUTES
  ) {
    const startHours = Math.floor(startMinutes / 60)
    const startMins = startMinutes % 60
    const endMinutes = startMinutes + LECTURE_DURATION_MINUTES
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60

    yield {
      startMs: combineUtc(day, startHours, startMins),
      endMs: combineUtc(day, endHours, endMins),
    }
  }
}

function generateLectureWindows(startDate: string, endDate: string): TimeInterval[] {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const windows: TimeInterval[] = []

  for (const day of iterDates(start, end)) {
    windows.push(...generateDailyWindows(day))
  }

  return windows
}

function buildExamIntervals(student: Student): TimeInterval[] {
  return student.exams.map((exam) => {
    const examDate = parseDate(exam.date)
    const { hours, minutes } = parseTime(exam.time)
    const startMs = combineUtc(examDate, hours, minutes)
    return {
      startMs,
      endMs: startMs + EXAM_DURATION_MINUTES * 60 * 1000,
    }
  })
}

function isStudentAvailable(student: Student, window: TimeInterval): boolean {
  return !buildExamIntervals(student).some((examInterval) => overlaps(examInterval, window))
}

function countAvailableStudents(students: Student[], window: TimeInterval): number {
  return students.filter((student) => isStudentAvailable(student, window)).length
}

function rankLectureWindows(students: Student[], windows: TimeInterval[]): LectureWindow[] {
  const ranked = windows.map((window) => {
    const startDate = new Date(window.startMs)
    const endDate = new Date(window.endMs)

    return {
      date: formatDate(startDate),
      start_time: formatTime(startDate.getUTCHours(), startDate.getUTCMinutes()),
      end_time: formatTime(endDate.getUTCHours(), endDate.getUTCMinutes()),
      available_students: countAvailableStudents(students, window),
    }
  })

  ranked.sort((a, b) => {
    if (b.available_students !== a.available_students) {
      return b.available_students - a.available_students
    }
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    return a.start_time.localeCompare(b.start_time)
  })

  return ranked.slice(0, TOP_N)
}

export function findBestLectureWindows(
  students: Student[],
  startDate: string,
  endDate: string,
): ScheduleResponse {
  const windows = generateLectureWindows(startDate, endDate)
  const bestWindows = rankLectureWindows(students, windows)

  return {
    total_students: students.length,
    best_windows: bestWindows,
  }
}
