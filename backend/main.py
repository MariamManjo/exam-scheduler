from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from backend.ocr import extract_students_from_images
from backend.scheduler import find_best_lecture_windows

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Exam(BaseModel):
    date: str
    time: str


class Student(BaseModel):
    name: str
    exams: List[Exam]


class RequestData(BaseModel):
    students: List[Student]
    start_date: str
    end_date: str


class ExtractedExamResponse(BaseModel):
    subject: str
    date: Optional[str] = None
    time: str


class ExtractedStudentResponse(BaseModel):
    name: str
    exams: List[ExtractedExamResponse]


class ExtractResponse(BaseModel):
    students: List[ExtractedStudentResponse]


@app.get("/")
def home():
    return {"message": "Exam Scheduler API is running"}


@app.post("/calculate")
def calculate(data: RequestData):
    return find_best_lecture_windows(
        students=data.students,
        start_date=data.start_date,
        end_date=data.end_date,
    )


@app.post("/extract", response_model=ExtractResponse)
async def extract(images: List[UploadFile] = File(...)):
    if not images:
        raise HTTPException(status_code=400, detail="At least one image file is required.")

    payloads: List[tuple[bytes, str]] = []
    for image in images:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type for {image.filename}. Upload image files only.",
            )
        payloads.append((await image.read(), image.content_type))

    try:
        result = extract_students_from_images(payloads)
    except ValueError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"OCR extraction failed: {error}",
        ) from error

    return result