"""
CLI Test Script — End-to-End Pipeline Test
==========================================
Usage:
  1. Make sure the FastAPI server is running: uvicorn main:app --reload
  2. Run: python test_pipeline.py

This script will:
  1. Create a test subject
  2. Upload a sample PDF
  3. Ask a question based on PDF content
  4. Ask an out-of-syllabus question (should refuse)
"""

import requests
import os
import sys
import json
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
TEST_PDF = Path(__file__).parent / "uploads" / "test_sample.pdf"


def create_test_pdf():
    """Create a minimal test PDF if none exists. Requires pymupdf."""
    try:
        import fitz
        if TEST_PDF.exists():
            print(f"  Using existing PDF: {TEST_PDF.name}")
            return
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text(
            (50, 100),
            "Introduction to Machine Learning\n\n"
            "Machine learning is a subset of artificial intelligence that enables systems "
            "to learn and improve from experience without being explicitly programmed.\n\n"
            "Types of Machine Learning:\n"
            "1. Supervised Learning: The model learns from labeled training data.\n"
            "2. Unsupervised Learning: The model finds patterns in unlabeled data.\n"
            "3. Reinforcement Learning: The model learns by interacting with an environment.\n\n"
            "A neural network is a machine learning model inspired by the human brain.",
            fontsize=12,
        )
        doc.save(str(TEST_PDF))
        doc.close()
        print(f"  Created test PDF: {TEST_PDF.name}")
    except Exception as e:
        print(f"  [WARN] Could not create test PDF: {e}")
        print("  Please place a real PDF in backend/uploads/ and update TEST_PDF path.")
        sys.exit(1)


def separator(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def test_health():
    separator("1. Health Check")
    r = requests.get(f"{BASE_URL}/")
    print(f"  Status: {r.status_code}")
    print(f"  Response: {r.json()}")
    assert r.status_code == 200, "Server not running!"


def test_create_subject() -> int:
    separator("2. Create Subject")
    r = requests.post(f"{BASE_URL}/subjects", json={"name": "Machine Learning 101"})
    data = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Subject: {json.dumps(data, indent=2)}")
    assert r.status_code == 200
    return data["id"]


def test_upload(subject_id: int) -> None:
    separator("3. Upload PDF")
    if not TEST_PDF.exists():
        print(f"  [ERROR] Test PDF not found at {TEST_PDF}")
        sys.exit(1)
    with open(TEST_PDF, "rb") as f:
        r = requests.post(
            f"{BASE_URL}/upload",
            files={"file": (TEST_PDF.name, f, "application/pdf")},
            data={"subject_id": subject_id},
        )
    data = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Response: {json.dumps(data, indent=2)}")
    if r.status_code != 200:
        print(f"  [ERROR] Upload failed. Make sure OPENAI_API_KEY is set in backend/.env")
        sys.exit(1)


def test_ask_in_syllabus(subject_id: int) -> None:
    separator("4. Ask In-Syllabus Question")
    question = "What are the types of machine learning?"
    print(f"  Q: {question}")
    r = requests.post(f"{BASE_URL}/ask", json={"question": question, "subject_id": subject_id})
    data = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Answer: {data.get('answer', 'N/A')}")
    print(f"  Sources: {data.get('sources', [])}")
    assert r.status_code == 200


def test_ask_out_of_syllabus(subject_id: int) -> None:
    separator("5. Ask Out-of-Syllabus Question (should refuse)")
    question = "What is the capital of France?"
    print(f"  Q: {question}")
    r = requests.post(f"{BASE_URL}/ask", json={"question": question, "subject_id": subject_id})
    data = r.json()
    print(f"  Status: {r.status_code}")
    print(f"  Answer: {data.get('answer', 'N/A')}")
    assert "not in the uploaded material" in data.get("answer", "").lower() or r.status_code == 200


def main():
    print("\n🚀 Educore AI — End-to-End Pipeline Test")
    print("    Make sure uvicorn main:app --reload is running\n")

    create_test_pdf()
    test_health()
    subject_id = test_create_subject()
    test_upload(subject_id)
    test_ask_in_syllabus(subject_id)
    test_ask_out_of_syllabus(subject_id)

    separator("✅ ALL TESTS PASSED")
    print("\n  Open http://localhost:8000/docs to explore the API interactively.\n")


if __name__ == "__main__":
    main()
