from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Any, Iterable, List, Sequence

WORK_START = time(9, 0)
WORK_END = time(21, 0)
LECTURE_DURATION = timedelta(hours=3)
EXAM_DURATION = timedelta(minutes=90)
WINDOW_STEP = timedelta(minutes=30)
TOP_N = 10


@dataclass(frozen=True)
class TimeInterval:
    start: datetime
    end: datetime

    def overlaps(self, other: TimeInterval) -> bool:
        return self.start < other.end and self.end > other.start


@dataclass(frozen=True)
class LectureWindow:
    date: date
    start_time: time
    end_time: time
    available_students: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "date": self.date.isoformat(),
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "available_students": self.available_students,
        }


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_time(value: str) -> time:
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Invalid time format: {value}")


def combine(date_value: date, time_value: time) -> datetime:
    return datetime.combine(date_value, time_value)


def iter_dates(start: date, end: date) -> Iterable[date]:
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def generate_daily_windows(day: date) -> Iterable[TimeInterval]:
    day_start = combine(day, WORK_START)
    day_end = combine(day, WORK_END)
    latest_start = day_end - LECTURE_DURATION

    current_start = day_start
    while current_start <= latest_start:
        yield TimeInterval(start=current_start, end=current_start + LECTURE_DURATION)
        current_start += WINDOW_STEP


def generate_lecture_windows(start_date: str, end_date: str) -> List[TimeInterval]:
    start = parse_date(start_date)
    end = parse_date(end_date)
    windows: List[TimeInterval] = []

    for day in iter_dates(start, end):
        windows.extend(generate_daily_windows(day))

    return windows


def build_exam_intervals(student: Any) -> List[TimeInterval]:
    intervals: List[TimeInterval] = []

    for exam in student.exams:
        exam_date = parse_date(exam.date)
        exam_start = combine(exam_date, parse_time(exam.time))
        intervals.append(TimeInterval(start=exam_start, end=exam_start + EXAM_DURATION))

    return intervals


def is_student_available(student: Any, window: TimeInterval) -> bool:
    for exam_interval in build_exam_intervals(student):
        if exam_interval.overlaps(window):
            return False
    return True


def count_available_students(students: Sequence[Any], window: TimeInterval) -> int:
    return sum(1 for student in students if is_student_available(student, window))


def rank_lecture_windows(
    students: Sequence[Any], windows: Sequence[TimeInterval]
) -> List[LectureWindow]:
    ranked: List[LectureWindow] = []

    for window in windows:
        ranked.append(
            LectureWindow(
                date=window.start.date(),
                start_time=window.start.time(),
                end_time=window.end.time(),
                available_students=count_available_students(students, window),
            )
        )

    ranked.sort(
        key=lambda item: (-item.available_students, item.date, item.start_time)
    )
    return ranked[:TOP_N]


def find_best_lecture_windows(
    students: Sequence[Any], start_date: str, end_date: str
) -> dict[str, Any]:
    windows = generate_lecture_windows(start_date, end_date)
    best_windows = rank_lecture_windows(students, windows)

    return {
        "total_students": len(students),
        "best_windows": [window.to_dict() for window in best_windows],
    }
