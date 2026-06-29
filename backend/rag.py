import os
import json
from pathlib import Path

import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

FAISS_INDEX_DIR = Path(__file__).parent / "faiss_index"
FAISS_INDEX_DIR.mkdir(exist_ok=True)

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100

# Groq model to use for chat completions
GROQ_MODEL = "llama-3.3-70b-versatile"


# ─────────────────────────────────────────────
# PDF Text Extraction
# ─────────────────────────────────────────────

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF using PyMuPDF (page by page)."""
    doc = fitz.open(pdf_path)
    full_text = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text")
        if text.strip():
            full_text.append(f"[Page {page_num}]\n{text}")
    doc.close()
    return "\n\n".join(full_text)


# ─────────────────────────────────────────────
# Chunking
# ─────────────────────────────────────────────

def chunk_text(raw_text: str, subject_id: str, filename: str) -> tuple[list[str], list[dict]]:
    """Split text into overlapping chunks with metadata tags."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    chunks = splitter.split_text(raw_text)
    metadatas = [
        {"subject": str(subject_id), "source": filename}
        for _ in chunks
    ]
    return chunks, metadatas


# ─────────────────────────────────────────────
# FAISS Vector Store  (local HuggingFace embeddings — no API key needed)
# ─────────────────────────────────────────────

def get_embeddings():
    """Return an embedding model based on configuration:
    1. If HUGGINGFACEHUB_API_TOKEN / HF_TOKEN is set, use HuggingFaceHubEmbeddings.
    2. If OPENAI_API_KEY is set, use OpenAIEmbeddings.
    3. Fallback to FastEmbedEmbeddings (lightweight ONNX runtime CPU, no PyTorch).
    """
    hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("HF_TOKEN")
    if hf_token:
        from langchain_community.embeddings import HuggingFaceHubEmbeddings
        return HuggingFaceHubEmbeddings(
            repo_id="sentence-transformers/all-MiniLM-L6-v2",
            huggingfacehub_api_token=hf_token
        )

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(openai_api_key=openai_key)

    from langchain_community.embeddings import FastEmbedEmbeddings
    return FastEmbedEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


def _index_path(subject_id: str) -> str:
    return str(FAISS_INDEX_DIR / f"subject_{subject_id}")


def store_in_faiss(chunks: list[str], metadatas: list[dict], subject_id: str) -> None:
    """Embed chunks and save/merge into the subject's FAISS index."""
    embeddings = get_embeddings()
    index_path = _index_path(subject_id)

    if Path(index_path).exists():
        # Merge with existing index
        existing = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
        new_store = FAISS.from_texts(chunks, embeddings, metadatas=metadatas)
        existing.merge_from(new_store)
        existing.save_local(index_path)
    else:
        vectorstore = FAISS.from_texts(chunks, embeddings, metadatas=metadatas)
        vectorstore.save_local(index_path)


def load_faiss(subject_id: str) -> FAISS:
    """Load the FAISS index for a given subject."""
    embeddings = get_embeddings()
    index_path = _index_path(subject_id)
    if not Path(index_path).exists():
        raise FileNotFoundError(f"No FAISS index found for subject_id={subject_id}. Upload a PDF first.")
    return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)


# ─────────────────────────────────────────────
# Full Ingestion Pipeline
# ─────────────────────────────────────────────

def ingest_pdf(pdf_path: str, subject_id: str, filename: str) -> int:
    """
    Full pipeline: extract → chunk → embed → store in FAISS.
    Returns the number of chunks created.
    """
    raw_text = extract_text_from_pdf(pdf_path)
    if not raw_text.strip():
        raise ValueError("PDF appears to be empty or could not be parsed.")
    chunks, metadatas = chunk_text(raw_text, subject_id, filename)
    store_in_faiss(chunks, metadatas, subject_id)
    return len(chunks)


# ─────────────────────────────────────────────
# RAG Q&A  (Groq LLM via OpenAI-compatible API)
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are KNOA (Knowledge Navigation & Optimization Assistant), a warm, friendly, and highly personalized academic tutor.
Your goal is to be encouraging and supportive while helping the student learn.
Answer ONLY from the context provided.
If the answer is not in the context, say:
'I'm sorry, but I couldn't find that topic in the uploaded material. Could you check if it's there?'
Always naturally mention which document or source you used to find the answer."""


def _groq_client():
    """Return an OpenAI client pointed at Groq's API."""
    from openai import OpenAI
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set in .env")
    return OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
    )


def answer_question(question: str, subject_id: str, k: int = 5) -> dict:
    """
    Retrieve top-k chunks from FAISS, build context, call Groq LLM.
    Returns {"answer": str, "sources": list[str]}.
    """
    vectorstore = load_faiss(subject_id)
    docs = vectorstore.similarity_search(question, k=k, filter={"subject": str(subject_id)})

    if not docs:
        return {
            "answer": "This topic is not in the uploaded material.",
            "sources": [],
        }

    context_parts = []
    sources = []
    for doc in docs:
        source = doc.metadata.get("source", "unknown")
        context_parts.append(f"[Source: {source}]\n{doc.page_content}")
        if source not in sources:
            sources.append(source)

    context = "\n\n---\n\n".join(context_parts)
    user_message = f"Context:\n{context}\n\nQuestion: {question}"

    client = _groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": sources,
    }


# ─────────────────────────────────────────────
# MCQ Generation  (Groq LLM)
# ─────────────────────────────────────────────

MCQ_PROMPT = """From the context below, generate {n} multiple choice questions.
Return ONLY valid JSON — no markdown, no code fences, no explanation.
Format:
[{{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}}]

Context:
{context}"""


def generate_mcq(subject_id: str, n: int = 10) -> list[dict]:
    """
    Retrieve top-10 chunks for the subject, call Groq to generate MCQs.
    Returns a list of MCQ dicts.
    """
    vectorstore = load_faiss(subject_id)
    # Dummy query to get top chunks representative of the whole subject
    docs = vectorstore.similarity_search("key concepts topics summary", k=10)

    if not docs:
        raise ValueError("No content found for this subject. Upload a PDF first.")

    context = "\n\n---\n\n".join(doc.page_content for doc in docs)
    prompt = MCQ_PROMPT.format(n=n, context=context)

    client = _groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=4096,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if model added them anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        questions = json.loads(raw)
        return questions
    except Exception as e:
        print(f"Error parsing MCQs: {e}")
        return []

# ─────────────────────────────────────────────
# AI Study Suggestions
# ─────────────────────────────────────────────

SUGGESTION_PROMPT = """You are KNOA, the student's personal academic AI counselor.
Based on the student's quiz performance data below, provide 3-4 highly personalized study suggestions.

Student Name: {name}
Performance Stats: {stats}
Recent History: {history}

Analyze their strengths and weaknesses. Be encouraging, warm, and specific.
If they are doing great, suggest advanced topics. If they are struggling, suggest foundational review.

Return ONLY valid JSON — no markdown, no code fences, no explanation.
Format:
{{
  "summary": "A warm 1-2 sentence overview of their current standing.",
  "suggestions": [
    {{
      "topic": "Subject/Topic Name",
      "advice": "Specific actionable advice.",
      "priority": "high" | "medium" | "low"
    }}
  ]
}}"""

def generate_study_suggestions(name: str, stats: list, history: list) -> dict:
    """
    Call Groq to generate personalized study advice based on student metrics.
    """
    prompt = SUGGESTION_PROMPT.format(
        name=name,
        stats=json.dumps(stats),
        history=json.dumps(history)
    )

    client = _groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=2048,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if model added them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except Exception as e:
        # Fallback if JSON parsing fails
        return {
            "summary": "We encountered an issue analyzing your latest data, but keep up the great work!",
            "suggestions": [
                {
                    "topic": "General Review",
                    "advice": "Continue practicing your weak areas and review your quiz results regularly.",
                    "priority": "medium"
                }
            ]
        }
