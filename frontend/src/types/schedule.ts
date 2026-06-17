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

export interface RankedWindow extends LectureWindow {
  rank: number
}

export interface Exam {
  date: string
  time: string
}

export interface Student {
  name: string
  exams: Exam[]
}

export interface CalculateScheduleRequest {
  students: Student[]
  start_date: string
  end_date: string
}
