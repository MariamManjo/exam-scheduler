import { useCallback, useState } from 'react'
import {
  addExam,
  deleteExam,
  deleteStudent,
  updateExam,
  updateStudentName,
} from '../lib/students'
import type { ExtractedStudent } from '../types/upload'

export function useStudentReview(initialStudents: ExtractedStudent[] = []) {
  const [students, setStudents] = useState<ExtractedStudent[]>(initialStudents)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(initialStudents.slice(0, 1).map((student) => student.id)),
  )

  const toggleExpanded = useCallback((studentId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(students.map((student) => student.id)))
  }, [students])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const setName = useCallback((studentId: string, name: string) => {
    setStudents((current) => updateStudentName(current, studentId, name))
  }, [])

  const editExam = useCallback(
    (
      studentId: string,
      examId: string,
      patch: { subject?: string; date?: string | null; time?: string },
    ) => {
      setStudents((current) => updateExam(current, studentId, examId, patch))
    },
    [],
  )

  const removeExam = useCallback((studentId: string, examId: string) => {
    setStudents((current) => deleteExam(current, studentId, examId))
  }, [])

  const createExam = useCallback((studentId: string, sourceImageId: string) => {
    setStudents((current) => addExam(current, studentId, sourceImageId))
    setExpandedIds((current) => new Set(current).add(studentId))
  }, [])

  const removeStudent = useCallback((studentId: string) => {
    setStudents((current) => deleteStudent(current, studentId))
    setExpandedIds((current) => {
      const next = new Set(current)
      next.delete(studentId)
      return next
    })
  }, [])

  const resetStudents = useCallback((nextStudents: ExtractedStudent[]) => {
    setStudents(nextStudents)
    setExpandedIds(new Set(nextStudents.slice(0, 1).map((student) => student.id)))
  }, [])

  return {
    students,
    expandedIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    setName,
    editExam,
    removeExam,
    createExam,
    removeStudent,
    resetStudents,
  }
}
