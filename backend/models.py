from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Common response models and input models

class UserCreate(BaseModel):
    username: str
    password: str
    role: str # "faculty" or "student"
    branch: Optional[str] = None
    semester: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    branch: Optional[str] = None
    semester: Optional[int] = None

class SubjectCreate(BaseModel):
    name: str

class AskRequest(BaseModel):
    question: str
    subject_id: str

class AnswerItem(BaseModel):
    question_index: int
    selected: str

class QuizSubmit(BaseModel):
    answers: list[str]

# Note: In PyMongo, documents are just dicts. We use these models mainly for API request/response validation.

class SubjectResponse(BaseModel):
    id: str
    name: str

class DocumentResponse(BaseModel):
    id: str
    filename: str
    subject_id: str
    status: str

class QuizResponse(BaseModel):
    quiz_id: str
    subject: str
    question_count: int
    link_id: str
    link: str

class QuizPublicResponse(BaseModel):
    quiz_id: str
    link_id: str
    subject: str
    questions: List[Dict[str, Any]]

class QuizAttemptResponse(BaseModel):
    score: int
    total: int
    percentage: float
    results: List[Dict[str, Any]]

class MCQItem(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: Optional[str] = ""

class QuizCreateCustom(BaseModel):
    subject_id: str
    semester: Optional[int] = None
    questions: List[MCQItem]
