from __future__ import annotations

import base64
import json
import os
import re
from datetime import date as date_type
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from openai import OpenAI

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load OPENAI_API_KEY from backend/.env first, then project root .env.
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env")

MODEL = "gpt-4.1-mini"
DEFAULT_OCR_YEAR = "2026"

ISO_DATE_PATTERN = re.compile(r"^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")

GEORGIAN_MONTHS = {
    "იანვარი": "01",
    "თებერვალი": "02",
    "მარტი": "03",
    "აპრილი": "04",
    "მაისი": "05",
    "ივნისი": "06",
    "ივლისი": "07",
    "აგვისტო": "08",
    "სექტემბერი": "09",
    "ოქტომბერი": "10",
    "ნოემბერი": "11",
    "დეკემბერი": "12",
}

ENGLISH_MONTHS = {
    "january": "01",
    "february": "02",
    "march": "03",
    "april": "04",
    "may": "05",
    "june": "06",
    "july": "07",
    "august": "08",
    "september": "09",
    "october": "10",
    "november": "11",
    "december": "12",
}

EXTRACTION_PROMPT = """You are extracting exam timetable data from a Georgian university (BTU) exam schedule screenshot.

This request contains exactly ONE uploaded screenshot for exactly ONE student.
- Extract data for this student only.
- Return exactly one student object.
- Include only exams visible on THIS screenshot.
- NEVER merge, combine, or mix exams from other students or other images.

Critical rules:
- Extract every visible exam row from this student's timetable on this screenshot.
- Ignore classroom, auditorium, building, and room columns.
- Return JSON only, matching the provided schema.
- subject: exam subject/course name exactly as shown.
- day: day of month as digits only (e.g. "22"). Use only what is visible.
- month: month as two digits (e.g. "06", "07"). Never return month names in this field.
  - Convert Georgian month names to numeric months.
  - ივნისი = 06
  - ივლისი = 07
- year: four-digit year ONLY if it is clearly visible in the screenshot.
  - BTU screenshots often do NOT show a year. In that case return an empty string "".
  - The backend will apply a default exam year when month and day are visible.
- time: exam start time in 24-hour HH:MM format.
- name: student name if clearly visible on the screenshot; otherwise use the fallback name provided in the user message.
- If no exams are visible, return an empty exams array.

Never return dates as 22.06.2026, 22/06/2026, or text like June 22.
Return separate day, month, and year fields only.
"""

STUDENT_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "exams": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string"},
                    "day": {"type": "string"},
                    "month": {"type": "string"},
                    "year": {"type": "string"},
                    "time": {"type": "string"},
                },
                "required": ["subject", "day", "month", "year", "time"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["name", "exams"],
    "additionalProperties": False,
}


def get_default_ocr_year() -> str:
    """Return the configured default year for month/day-only BTU exam dates."""
    value = os.getenv("OCR_DEFAULT_YEAR", DEFAULT_OCR_YEAR).strip()
    match = re.fullmatch(r"(20\d{2})", value)
    if match:
        return match.group(1)
    return DEFAULT_OCR_YEAR


def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY is not set. Add it to backend/.env or the project root .env file."
        )
    return OpenAI(api_key=api_key)


def _image_to_data_url(image_bytes: bytes, content_type: str) -> str:
    media_type = content_type if content_type.startswith("image/") else "image/jpeg"
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{media_type};base64,{encoded}"


def _normalize_time(value: str) -> str:
    cleaned = value.strip().replace(".", ":")
    match = re.search(r"(\d{1,2}):(\d{2})", cleaned)
    if not match:
        return "09:00"
    hours = int(match.group(1))
    minutes = int(match.group(2))
    return f"{hours:02d}:{minutes:02d}"


def _normalize_day(value: str) -> Optional[str]:
    match = re.search(r"(\d{1,2})", value.strip())
    if not match:
        return None
    day = int(match.group(1))
    if day < 1 or day > 31:
        return None
    return f"{day:02d}"


def _normalize_month(value: str) -> Optional[str]:
    cleaned = value.strip()
    if not cleaned:
        return None

    if re.fullmatch(r"\d{1,2}", cleaned):
        month = int(cleaned)
        if 1 <= month <= 12:
            return f"{month:02d}"
        return None

    lowered = cleaned.lower()
    for month_name, month_number in GEORGIAN_MONTHS.items():
        if month_name in lowered:
            return month_number

    for month_name, month_number in ENGLISH_MONTHS.items():
        if month_name in lowered:
            return month_number

    return None


def _normalize_year(value: str) -> Optional[str]:
    cleaned = value.strip()
    match = re.fullmatch(r"(20\d{2})", cleaned)
    if match:
        return match.group(1)
    return None


def _validate_iso_date(year: str, month: str, day: str) -> Optional[str]:
    try:
        parsed = date_type(int(year), int(month), int(day))
    except ValueError:
        return None
    iso = parsed.isoformat()
    if not ISO_DATE_PATTERN.fullmatch(iso):
        return None
    return iso


def _parse_embedded_date(value: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    cleaned = value.strip()
    if not cleaned:
        return None, None, None

    iso_match = ISO_DATE_PATTERN.fullmatch(cleaned)
    if iso_match:
        return iso_match.group(1), iso_match.group(2), iso_match.group(3)

    for pattern in (
        r"^(20\d{2})[./-](\d{1,2})[./-](\d{1,2})$",
        r"^(\d{1,2})[./-](\d{1,2})[./-](20\d{2})$",
    ):
        match = re.fullmatch(pattern, cleaned)
        if not match:
            continue
        if pattern.startswith("^("):
            if match.lastindex == 3 and match.group(1).startswith("20"):
                year, month, day = match.group(1), match.group(2), match.group(3)
            else:
                day, month, year = match.group(1), match.group(2), match.group(3)
            return _normalize_year(year), _normalize_month(month), _normalize_day(day)

    lowered = cleaned.lower()
    for month_name, month_number in {**GEORGIAN_MONTHS, **ENGLISH_MONTHS}.items():
        if month_name in lowered:
            day_match = re.search(r"(\d{1,2})", cleaned)
            year_match = re.search(r"(20\d{2})", cleaned)
            if day_match:
                return (
                    _normalize_year(year_match.group(1)) if year_match else None,
                    month_number,
                    _normalize_day(day_match.group(1)),
                )

    return None, None, None


def _resolve_iso_date(exam: Dict[str, Any]) -> Optional[str]:
    day = _normalize_day(str(exam.get("day", "")))
    month = _normalize_month(str(exam.get("month", "")))
    year = _normalize_year(str(exam.get("year", "")))

    for value in (exam.get("day"), exam.get("month"), exam.get("year")):
        embedded_year, embedded_month, embedded_day = _parse_embedded_date(str(value or ""))
        year = year or embedded_year
        month = month or embedded_month
        day = day or embedded_day

    if not month or not day:
        return None

    if not year:
        year = get_default_ocr_year()

    return _validate_iso_date(year, month, day)


def _normalize_student(student: Dict[str, Any], fallback_name: str) -> Dict[str, Any]:
    name = (student.get("name") or "").strip() or fallback_name
    exams: List[Dict[str, Optional[str]]] = []

    for exam in student.get("exams", []):
        subject = (exam.get("subject") or "").strip()
        time = _normalize_time(str(exam.get("time", "")))
        iso_date = _resolve_iso_date(exam)

        if not subject and not iso_date and not time:
            continue

        exams.append(
            {
                "subject": subject,
                "date": iso_date,
                "time": time,
            }
        )

    return {"name": name, "exams": exams}


def extract_student_from_image(
    image_bytes: bytes,
    content_type: str,
    fallback_name: str,
) -> Dict[str, Any]:
    """Extract exactly one student from exactly one uploaded image."""
    client = get_openai_client()
    data_url = _image_to_data_url(image_bytes, content_type)

    response = client.responses.create(
        model=MODEL,
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            f"{EXTRACTION_PROMPT}\n\n"
                            f"This screenshot belongs to exactly one student.\n"
                            f"Fallback student name if not visible: {fallback_name}"
                        ),
                    },
                    {"type": "input_image", "image_url": data_url},
                ],
            }
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "student_exams",
                "strict": True,
                "schema": STUDENT_SCHEMA,
            }
        },
    )

    raw = response.output_text
    if not raw:
        return {"name": fallback_name, "exams": []}

    parsed = json.loads(raw)
    return _normalize_student(parsed, fallback_name)


def extract_students_from_images(
    images: List[tuple[bytes, str]],
) -> Dict[str, List[Dict[str, Any]]]:
    """Return exactly one student per uploaded image, in upload order."""
    students: List[Dict[str, Any]] = []

    for index, (image_bytes, content_type) in enumerate(images):
        fallback_name = f"Student {index + 1}"
        students.append(
            extract_student_from_image(image_bytes, content_type, fallback_name)
        )

    if len(students) != len(images):
        raise ValueError("OCR extraction must return one student per uploaded image.")

    return {"students": students}
