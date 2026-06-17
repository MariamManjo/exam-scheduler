import OpenAI from 'openai'

const MODEL = 'gpt-4.1-mini'
const DEFAULT_OCR_YEAR = '2026'
const ISO_DATE_PATTERN = /^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

const GEORGIAN_MONTHS: Record<string, string> = {
  იანვარი: '01',
  თებერვალი: '02',
  მარტი: '03',
  აპრილი: '04',
  მაისი: '05',
  ივნისი: '06',
  ივლისი: '07',
  აგვისტო: '08',
  სექტემბერი: '09',
  ოქტომბერი: '10',
  ნოემბერი: '11',
  დეკემბერი: '12',
}

const ENGLISH_MONTHS: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
}

const EXTRACTION_PROMPT = `You are extracting exam timetable data from a Georgian university (BTU) exam schedule screenshot.

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
Return separate day, month, and year fields only.`

const STUDENT_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    exams: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          day: { type: 'string' },
          month: { type: 'string' },
          year: { type: 'string' },
          time: { type: 'string' },
        },
        required: ['subject', 'day', 'month', 'year', 'time'],
        additionalProperties: false,
      },
    },
  },
  required: ['name', 'exams'],
  additionalProperties: false,
} as const

export interface ExtractedExam {
  subject: string
  date: string | null
  time: string
}

export interface ExtractedStudent {
  name: string
  exams: ExtractedExam[]
}

function getDefaultOcrYear(): string {
  const value = (process.env.OCR_DEFAULT_YEAR ?? DEFAULT_OCR_YEAR).trim()
  const match = value.match(/^(20\d{2})$/)
  return match ? match[1] : DEFAULT_OCR_YEAR
}

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in Vercel environment variables.')
  }
  return new OpenAI({ apiKey })
}

function normalizeTime(value: string): string {
  const cleaned = value.trim().replace('.', ':')
  const match = cleaned.match(/(\d{1,2}):(\d{2})/)
  if (!match) return '09:00'
  return `${Number(match[1]).toString().padStart(2, '0')}:${match[2]}`
}

function normalizeDay(value: string): string | null {
  const match = value.trim().match(/(\d{1,2})/)
  if (!match) return null
  const day = Number(match[1])
  if (day < 1 || day > 31) return null
  return String(day).padStart(2, '0')
}

function normalizeMonth(value: string): string | null {
  const cleaned = value.trim()
  if (!cleaned) return null

  if (/^\d{1,2}$/.test(cleaned)) {
    const month = Number(cleaned)
    if (month >= 1 && month <= 12) return String(month).padStart(2, '0')
    return null
  }

  const lowered = cleaned.toLowerCase()
  for (const [monthName, monthNumber] of Object.entries(GEORGIAN_MONTHS)) {
    if (lowered.includes(monthName)) return monthNumber
  }
  for (const [monthName, monthNumber] of Object.entries(ENGLISH_MONTHS)) {
    if (lowered.includes(monthName)) return monthNumber
  }

  return null
}

function normalizeYear(value: string): string | null {
  const match = value.trim().match(/^(20\d{2})$/)
  return match ? match[1] : null
}

function validateIsoDate(year: string, month: string, day: string): string | null {
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null
  }
  const iso = `${year}-${month}-${day}`
  return ISO_DATE_PATTERN.test(iso) ? iso : null
}

function parseEmbeddedDate(value: string): {
  year: string | null
  month: string | null
  day: string | null
} {
  const cleaned = value.trim()
  if (!cleaned) return { year: null, month: null, day: null }

  const isoMatch = cleaned.match(ISO_DATE_PATTERN)
  if (isoMatch) {
    return { year: isoMatch[1], month: isoMatch[2], day: isoMatch[3] }
  }

  const ymdMatch = cleaned.match(/^(20\d{2})[./-](\d{1,2})[./-](\d{1,2})$/)
  if (ymdMatch) {
    return {
      year: normalizeYear(ymdMatch[1]),
      month: normalizeMonth(ymdMatch[2]),
      day: normalizeDay(ymdMatch[3]),
    }
  }

  const dmyMatch = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](20\d{2})$/)
  if (dmyMatch) {
    return {
      year: normalizeYear(dmyMatch[3]),
      month: normalizeMonth(dmyMatch[2]),
      day: normalizeDay(dmyMatch[1]),
    }
  }

  const lowered = cleaned.toLowerCase()
  for (const [monthName, monthNumber] of Object.entries({
    ...GEORGIAN_MONTHS,
    ...ENGLISH_MONTHS,
  })) {
    if (lowered.includes(monthName)) {
      const dayMatch = cleaned.match(/(\d{1,2})/)
      const yearMatch = cleaned.match(/(20\d{2})/)
      if (dayMatch) {
        return {
          year: yearMatch ? normalizeYear(yearMatch[1]) : null,
          month: monthNumber,
          day: normalizeDay(dayMatch[1]),
        }
      }
    }
  }

  return { year: null, month: null, day: null }
}

function resolveIsoDate(exam: Record<string, unknown>): string | null {
  let day = normalizeDay(String(exam.day ?? ''))
  let month = normalizeMonth(String(exam.month ?? ''))
  let year = normalizeYear(String(exam.year ?? ''))

  for (const value of [exam.day, exam.month, exam.year]) {
    const embedded = parseEmbeddedDate(String(value ?? ''))
    year = year ?? embedded.year
    month = month ?? embedded.month
    day = day ?? embedded.day
  }

  if (!month || !day) return null
  if (!year) year = getDefaultOcrYear()

  return validateIsoDate(year, month, day)
}

function normalizeStudent(
  student: Record<string, unknown>,
  fallbackName: string,
): ExtractedStudent {
  const name = String(student.name ?? '').trim() || fallbackName
  const exams: ExtractedExam[] = []

  for (const rawExam of (student.exams as Record<string, unknown>[]) ?? []) {
    const subject = String(rawExam.subject ?? '').trim()
    const time = normalizeTime(String(rawExam.time ?? ''))
    const date = resolveIsoDate(rawExam)

    if (!subject && !date && !time) continue

    exams.push({ subject, date, time })
  }

  return { name, exams }
}

export async function extractStudentFromImage(
  imageBase64: string,
  contentType: string,
  fallbackName: string,
): Promise<ExtractedStudent> {
  const client = getOpenAiClient()
  const mediaType = contentType.startsWith('image/') ? contentType : 'image/jpeg'
  const dataUrl = `data:${mediaType};base64,${imageBase64}`

  const response = await client.responses.create({
    model: MODEL,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `${EXTRACTION_PROMPT}\n\nThis screenshot belongs to exactly one student.\nFallback student name if not visible: ${fallbackName}`,
          },
          { type: 'input_image', image_url: dataUrl, detail: 'auto' },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'student_exams',
        strict: true,
        schema: STUDENT_SCHEMA,
      },
    },
  })

  const raw = response.output_text
  if (!raw) return { name: fallbackName, exams: [] }

  const parsed = JSON.parse(raw) as Record<string, unknown>
  return normalizeStudent(parsed, fallbackName)
}
