import type { Student } from '../types/schedule'
import type { ExtractedExam, ExtractedStudent } from '../types/upload'
import { isValidIsoDate, isValidTime } from './examValidation'
import { createId } from './ids'

export function toApiStudents(students: ExtractedStudent[]): Student[] {
  return students.map((student) => ({
    name: student.name.trim(),
    exams: student.exams.map((exam) => ({
      date: isValidIsoDate(exam.date) ? exam.date! : '',
      time: isValidTime(exam.time) ? exam.time : '',
    })),
  }))
}

export function updateStudentName(
  students: ExtractedStudent[],
  studentId: string,
  name: string,
): ExtractedStudent[] {
  return students.map((student) =>
    student.id === studentId ? { ...student, name } : student,
  )
}

export function updateExam(
  students: ExtractedStudent[],
  studentId: string,
  examId: string,
  patch: Partial<Pick<ExtractedExam, 'subject' | 'date' | 'time'>>,
): ExtractedStudent[] {
  return students.map((student) => {
    if (student.id !== studentId) return student
    return {
      ...student,
      exams: student.exams.map((exam) =>
        exam.id === examId ? { ...exam, ...patch } : exam,
      ),
    }
  })
}

export function deleteExam(
  students: ExtractedStudent[],
  studentId: string,
  examId: string,
): ExtractedStudent[] {
  return students.map((student) => {
    if (student.id !== studentId) return student
    return { ...student, exams: student.exams.filter((exam) => exam.id !== examId) }
  })
}

export function addExam(
  students: ExtractedStudent[],
  studentId: string,
  sourceImageId: string,
): ExtractedStudent[] {
  const today = new Date().toISOString().slice(0, 10)
  return students.map((student) => {
    if (student.id !== studentId) return student
    return {
      ...student,
      exams: [
        ...student.exams,
        { id: createId(), subject: '', date: today, time: '09:00', sourceImageId },
      ],
    }
  })
}

export function deleteStudent(
  students: ExtractedStudent[],
  studentId: string,
): ExtractedStudent[] {
  return students.filter((student) => student.id !== studentId)
}

export function countExams(students: ExtractedStudent[]): number {
  return students.reduce((total, student) => total + student.exams.length, 0)
}
