import os
import json
import uuid
import shutil
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from bson.objectid import ObjectId

from database import get_db
from models import (
    UserCreate, Token, SubjectCreate, AskRequest, QuizSubmit,
    SubjectResponse, DocumentResponse, QuizResponse, QuizPublicResponse, QuizAttemptResponse,
    QuizCreateCustom
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_faculty, require_student
)
from rag import ingest_pdf, answer_question, generate_mcq, generate_study_suggestions

# ─────────────────────────────────────────────
# App Setup
# ─────────────────────────────────────────────

app = FastAPI(
    title="Educore AI",
    description="RAG-based Q&A + MCQ Quiz platform for faculty and students",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://educore-ai-zeta.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Helper to convert MongoDB _id to string id in dicts
def document_to_dict(doc):
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

# ─────────────────────────────────────────────
# Auth Endpoints
# ─────────────────────────────────────────────

@app.post("/auth/register", response_model=Token, tags=["Auth"])
def register(user: UserCreate, db=Depends(get_db)):
    if user.role not in ["faculty", "student"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'faculty' or 'student'.")
        
    if db["users"].find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
        
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "hashed_password": hashed_password,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    
    if user.branch:
        user_dict["branch"] = user.branch
    if user.role == "student" and user.semester is not None:
        user_dict["semester"] = user.semester
    
    result = db["users"].insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "username": user.username,
        "branch": user_dict.get("branch"),
        "semester": user_dict.get("semester")
    }

@app.post("/auth/login", response_model=Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = db["users"].find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user["role"], 
        "username": user["username"],
        "branch": user.get("branch"),
        "semester": user.get("semester")
    }


# ─────────────────────────────────────────────
# Subject Endpoints
# ─────────────────────────────────────────────

@app.post("/subjects", tags=["Subjects"], response_model=SubjectResponse)
def create_subject(payload: SubjectCreate, current_user=Depends(require_faculty), db=Depends(get_db)):
    existing = db["subjects"].find_one({"name": payload.name})
    if existing:
        return document_to_dict(existing)
        
    subject = {"name": payload.name, "created_by": str(current_user["_id"])}
    result = db["subjects"].insert_one(subject)
    subject["_id"] = result.inserted_id
    return document_to_dict(subject)


@app.get("/subjects", tags=["Subjects"])
def list_subjects(current_user=Depends(get_current_user), db=Depends(get_db)):
    subjects = list(db["subjects"].find())
    return [document_to_dict(s) for s in subjects]


# ─────────────────────────────────────────────
# Upload Endpoint
# ─────────────────────────────────────────────

@app.post("/upload", tags=["Documents"])
async def upload_pdf(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    current_user=Depends(require_faculty),
    db=Depends(get_db),
):
    subject = db["subjects"].find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject not found.")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    save_path = UPLOAD_DIR / file.filename
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    doc = {
        "subject_id": subject_id,
        "filename": file.filename,
        "status": "processing",
        "uploaded_by": str(current_user["_id"]),
        "uploaded_at": datetime.utcnow()
    }
    result = db["documents"].insert_one(doc)
    doc_id = str(result.inserted_id)

    try:
        chunk_count = ingest_pdf(str(save_path), subject_id, file.filename)
        db["documents"].update_one({"_id": result.inserted_id}, {"$set": {"status": "ready"}})
    except Exception as e:
        db["documents"].update_one({"_id": result.inserted_id}, {"$set": {"status": "failed"}})
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    return {
        "status": "ready",
        "document_id": doc_id,
        "filename": file.filename,
        "subject": subject["name"],
        "chunks_created": chunk_count,
    }


@app.get("/documents", tags=["Documents"])
def list_documents(subject_id: str = None, current_user=Depends(get_current_user), db=Depends(get_db)):
    query = {}
    if subject_id:
        query["subject_id"] = subject_id
    docs = list(db["documents"].find(query))
    return [document_to_dict(d) for d in docs]


# ─────────────────────────────────────────────
# Q&A Endpoint
# ─────────────────────────────────────────────

@app.post("/ask", tags=["Q&A"])
async def ask_question_endpoint(payload: AskRequest, current_user=Depends(get_current_user)):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = answer_question(payload.question, payload.subject_id, k=5)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Q&A failed: {str(e)}")

    return result


# ─────────────────────────────────────────────
# Quiz Endpoints
# ─────────────────────────────────────────────

@app.post("/quiz/generate", tags=["Quiz"])
async def generate_quiz_endpoint(subject_id: str, n: int = 10, semester: int = None, current_user=Depends(require_faculty), db=Depends(get_db)):
    subject = db["subjects"].find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    try:
        questions = generate_mcq(subject_id, n=n)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

    link_id = str(uuid.uuid4())
    quiz = {
        "subject_id": subject_id,
        "questions_json": json.dumps(questions),
        "link_id": link_id,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow()
    }
    if semester is not None:
        quiz["semester"] = semester

    result = db["quizzes"].insert_one(quiz)

    return {
        "quiz_id": str(result.inserted_id),
        "subject": subject["name"],
        "question_count": len(questions),
        "link_id": link_id,
        "link": f"/quiz/{link_id}",
    }

@app.post("/quiz/preview", tags=["Quiz"])
async def preview_quiz_endpoint(subject_id: str, n: int = 10, current_user=Depends(require_faculty), db=Depends(get_db)):
    """Generate questions without saving to DB."""
    subject = db["subjects"].find_one({"_id": ObjectId(subject_id)})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    try:
        questions = generate_mcq(subject_id, n=n)
        return questions
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")

@app.post("/quiz/save", tags=["Quiz"])
async def save_custom_quiz(payload: QuizCreateCustom, current_user=Depends(require_faculty), db=Depends(get_db)):
    """Save a quiz with a custom set of questions."""
    subject = db["subjects"].find_one({"_id": ObjectId(payload.subject_id)})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    link_id = str(uuid.uuid4())
    # questions are already validated by Pydantic as MCQItem
    # but we store them as JSON string in DB to match existing schema
    questions_list = [q.dict() for q in payload.questions]
    
    quiz = {
        "subject_id": payload.subject_id,
        "questions_json": json.dumps(questions_list),
        "link_id": link_id,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow()
    }
    if payload.semester is not None:
        quiz["semester"] = payload.semester

    result = db["quizzes"].insert_one(quiz)

    return {
        "quiz_id": str(result.inserted_id),
        "subject": subject["name"],
        "question_count": len(questions_list),
        "link_id": link_id,
        "link": f"/quiz/{link_id}",
    }


@app.get("/quizzes", tags=["Quiz"])
async def list_quizzes(current_user=Depends(get_current_user), db=Depends(get_db)):
    """Return all quizzes — used by the student quiz listing page."""
    query = {}
    if current_user.get("role") == "student" and current_user.get("semester") is not None:
        # If the student has a semester, filter quizzes by it.
        # We can include quizzes that are explicitly for this semester, or quizzes that don't have a semester set (general)
        query["$or"] = [
            {"semester": current_user.get("semester")},
            {"semester": {"$exists": False}}
        ]

    quizzes = list(db["quizzes"].find(query).sort("created_at", -1))
    result = []
    for quiz in quizzes:
        subject = db["subjects"].find_one({"_id": ObjectId(quiz["subject_id"])})
        questions = json.loads(quiz.get("questions_json", "[]"))
        
        creator_name = "Faculty"
        if quiz.get("created_by"):
            creator = db["users"].find_one({"_id": ObjectId(quiz["created_by"])})
            if creator:
                creator_name = creator["username"]

        result.append({
            "id": str(quiz["_id"]),
            "link_id": quiz.get("link_id", ""),
            "subject": subject["name"] if subject else "Unknown",
            "num_questions": len(questions),
            "created_at": quiz.get("created_at", datetime.utcnow()).isoformat(),
            "created_by": creator_name,
        })
    return result


@app.get("/quiz/{link_id}", tags=["Quiz"])
async def get_quiz(link_id: str, db=Depends(get_db)):
    quiz = db["quizzes"].find_one({"link_id": link_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    subject = db["subjects"].find_one({"_id": ObjectId(quiz["subject_id"])})
    questions = json.loads(quiz["questions_json"])

    # Strip correct answers before sending to student
    safe_questions = [
        {
            "question": q["question"],
            "options": q["options"],
            "explanation": q.get("explanation", ""),
        }
        for q in questions
    ]

    return {
        "quiz_id": str(quiz["_id"]),
        "link_id": link_id,
        "subject": subject["name"] if subject else "Unknown",
        "questions": safe_questions,
    }


@app.post("/quiz/{link_id}/submit", tags=["Quiz"])
async def submit_quiz(link_id: str, payload: QuizSubmit, current_user=Depends(require_student), db=Depends(get_db)):
    quiz = db["quizzes"].find_one({"link_id": link_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = json.loads(quiz["questions_json"])
    answers = payload.answers

    if len(answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(questions)} answers, got {len(answers)}.",
        )

    results = []
    score = 0
    for i, (q, student_ans) in enumerate(zip(questions, answers)):
        correct = q["answer"]
        is_correct = student_ans.strip().upper() == correct.strip().upper()
        if is_correct:
            score += 1
        results.append({
            "question_index": i,
            "question": q["question"],
            "your_answer": student_ans,
            "correct_answer": correct,
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    percentage = round(score / len(questions) * 100, 1)

    attempt = {
        "quiz_id": str(quiz["_id"]),
        "student_id": str(current_user["_id"]),
        "student_username": current_user["username"],
        "score": score,
        "total": len(questions),
        "percentage": percentage,
        "created_at": datetime.utcnow()
    }
    db["quiz_attempts"].insert_one(attempt)

    return {
        "score": score,
        "total": len(questions),
        "percentage": percentage,
        "results": results,
    }


# ─────────────────────────────────────────────
# Analytics Endpoints
# ─────────────────────────────────────────────

@app.get("/student/results", tags=["Analytics"])
def get_student_results(current_user=Depends(require_student), db=Depends(get_db)):
    attempts = list(db["quiz_attempts"].find({"student_id": str(current_user["_id"])}).sort("created_at", -1))
    results = []
    for att in attempts:
        quiz = db["quizzes"].find_one({"_id": ObjectId(att["quiz_id"])})
        subject = None
        if quiz:
            subject = db["subjects"].find_one({"_id": ObjectId(quiz["subject_id"])})
        
        subj_name = subject["name"] if subject else "Unknown"
        results.append({
            "id": str(att["_id"]),
            "subject": subj_name,
            "score": att["score"],
            "total": att["total"],
            "percentage": att["percentage"],
            "date": att["created_at"].isoformat() if "created_at" in att else None
        })
    return results

@app.get("/analytics", tags=["Analytics"])
def get_analytics(current_user=Depends(require_faculty), db=Depends(get_db)):
    attempts = list(db["quiz_attempts"].find())
    student_stats = {}
    subject_stats = {}
    
    for att in attempts:
        quiz = db["quizzes"].find_one({"_id": ObjectId(att["quiz_id"])})
        subject = None
        if quiz:
            subject = db["subjects"].find_one({"_id": ObjectId(quiz["subject_id"])})
            
        subj_name = subject["name"] if subject else "Unknown"
        stu = att.get("student_username", "Unknown")
        
        if stu not in student_stats:
            student_stats[stu] = {"attempts": 0, "total_score": 0, "total_questions": 0}
        student_stats[stu]["attempts"] += 1
        student_stats[stu]["total_score"] += att["score"]
        student_stats[stu]["total_questions"] += att["total"]
        
        if subj_name not in subject_stats:
            subject_stats[subj_name] = {"attempts": 0, "total_score": 0, "total_questions": 0}
        subject_stats[subj_name]["attempts"] += 1
        subject_stats[subj_name]["total_score"] += att["score"]
        subject_stats[subj_name]["total_questions"] += att["total"]

    student_list = [
        {
            "name": k, 
            "attempts": v["attempts"], 
            "avg_percentage": round(v["total_score"] / v["total_questions"] * 100, 1) if v["total_questions"] > 0 else 0
        }
        for k, v in student_stats.items()
    ]
    
    subject_list = [
        {
            "name": k, 
            "attempts": v["attempts"], 
            "avg_percentage": round(v["total_score"] / v["total_questions"] * 100, 1) if v["total_questions"] > 0 else 0
        }
        for k, v in subject_stats.items()
    ]
    
    return {
        "students": student_list,
        "subjects": subject_list
    }

@app.get("/student/ai-suggestions", tags=["Analytics"])
def get_student_ai_suggestions(current_user=Depends(require_student), db=Depends(get_db)):
    # 1. Fetch history
    attempts = list(db["quiz_attempts"].find({"student_id": str(current_user["_id"])}).sort("created_at", -1))
    
    if not attempts:
        return {
            "summary": "You haven't taken any quizzes yet! Start by taking a quiz to get personalized AI study recommendations.",
            "suggestions": []
        }

    # 2. Process stats
    subject_map = {}
    history_summary = []
    
    for att in attempts:
        quiz = db["quizzes"].find_one({"_id": ObjectId(att["quiz_id"])})
        subject = db["subjects"].find_one({"_id": ObjectId(quiz["subject_id"])}) if quiz else None
        subj_name = subject["name"] if subject else "Unknown"
        
        if subj_name not in subject_map:
            subject_map[subj_name] = {"total": 0, "count": 0}
        subject_map[subj_name]["total"] += att["percentage"]
        subject_map[subj_name]["count"] += 1
        
        if len(history_summary) < 5:
            history_summary.append({
                "subject": subj_name,
                "score": att["percentage"],
                "date": att.get("created_at", datetime.utcnow()).isoformat()
            })

    stats = [
        {"subject": k, "avg_percentage": round(v["total"] / v["count"], 1)}
        for k, v in subject_map.items()
    ]
    
    # 3. Call AI
    suggestions = generate_study_suggestions(
        name=current_user["username"],
        stats=stats,
        history=history_summary
    )
    
    return suggestions


# ─────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"message": "Educore AI API is running (MongoDB)", "docs": "/docs"}

