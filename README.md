# Educore AI

An advanced AI-powered platform designed to enhance the academic experience for both faculty and students. Leveraging Retrieval-Augmented Generation (RAG) and Large Language Models, this application enables automated Quiz generation and Question-Answering directly from course materials.

# Features
Role-Based Portals: Distinct dashboards for Students and Faculty members.
Document Ingestion: Faculty can upload course materials (PDFs).RAG-based Q&A**: Intelligent querying of uploaded documents using vector embeddings (FAISS) and LLMs.
Automated Quiz Generation: Generate multiple-choice questions (MCQs) from syllabus materials instantly.
Analytics & Tracking: Track student performance across different subjects and quizzes.
AI Study Suggestions: Personalized learning recommendations for students based on their quiz performance history.
Responsive & Accessible UI: Fully responsive mobile-first layouts with dynamic Light and Dark mode themes to ensure seamless usage across any device.

# Tech Stack

Frontend
Framework: React 18 with Vite
Styling: Tailwind CSS
Routing: React Router v6
Animations & UI: Framer Motion, Lucide React
Data Visualization: Recharts
HTTP Client: Axios

# Backend
Framework: FastAPI
Database: MongoDB (via PyMongo)
AI & RAG: LangChain, OpenAI API, HuggingFace (Sentence Transformers)
Vector Store: FAISS (faiss-cpu)
PDF Processing: PyMuPDF
Authentication: JWT Auth (python-jose, passlib)

# Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB
- Grok API Key


#Usage Flow
1. Register/Login: Users can sign up as either a "faculty" or "student".
2. Faculty Flow: 
   - Add new subjects.
   - Upload PDF materials for those subjects.
   - Generate quizzes from the uploaded materials.
   - Monitor student performance through the analytics dashboard.
3. Student Flow:
   - View available subjects and take generated quizzes.
   - Get immediate feedback and explanations for correct answers.
   - View personal performance history.
   - Receive AI-generated suggestions on what topics to focus on next.
  
     Live on: https://educore-ai-zeta.vercel.app
