import type { ExtractedStudent } from '../types/upload'

const ISO_DATE_PATTERN = /^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const SCHEDULE_VALIDATION_MESSAGE =
  'Please fix missing or invalid exam dates before scheduling.'

export function isValidIsoDate(value: string | null | undefined): boolean {
  if (!value || !ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime())
}

export function isValidTime(value: string | null | undefined): boolean {
  return Boolean(value && TIME_PATTERN.test(value))
}

export function studentsHaveValidExams(students: ExtractedStudent[]): boolean {
  return students.every((student) =>
    student.exams.every((exam) => isValidIsoDate(exam.date) && isValidTime(exam.time)),
  )
}
