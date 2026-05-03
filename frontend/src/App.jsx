import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import ChatPage from './pages/ChatPage'
import QuizPage from './pages/QuizPage'
import LoginPage from './pages/LoginPage'
import Footer from './components/Footer'
import { AuthProvider, useAuth } from './context/AuthContext'

// Faculty portal pages
import FacultyLayout from './pages/faculty/FacultyLayout'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyQuiz from './pages/faculty/FacultyQuiz'
import FacultyAnalytics from './pages/faculty/FacultyAnalytics'
import FacultyHistory from './pages/faculty/FacultyHistory'
import FacultyAccount from './pages/faculty/FacultyAccount'

// Student portal pages
import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentQuiz from './pages/student/StudentQuiz'
import StudentChat from './pages/student/StudentChat'
import StudentAnalytics from './pages/student/StudentAnalytics'
import StudentAccount from './pages/student/StudentAccount'

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-300'
        : 'text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-white dark:bg-gray-800'
    }`

  return (
    <nav className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5 group">
        <span className="text-2xl">🎓</span>
        <div>
          <span className="font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            Educore AI
          </span>
          <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-500 ml-2">AI Academic Assistant</span>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {(!user || user.role === 'faculty') && (
          <NavLink to="/faculty" className={linkClass}>Faculty</NavLink>
        )}
        {(!user || user.role === 'student') && (
          <NavLink to="/student/dashboard" className={linkClass}>Student</NavLink>
        )}
        
        <div className="w-px h-6 bg-white dark:bg-gray-800 mx-2"></div>
        
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400">Hi, <span className="text-gray-900 dark:text-white font-medium">{user.username}</span></span>
            <button 
              onClick={logout}
              className="text-sm font-medium px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="text-sm font-medium px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const isPortal = user?.role === 'student' || user?.role === 'faculty';
  const isLogin = location.pathname === '/login';

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col">
      {/* Hide global navbar inside portals (they have their own sidebar) and on login page */}
      {!isPortal && !isLogin && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          {/* ── Faculty Portal (sidebar layout) ── */}
          <Route 
            path="/faculty" 
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <FacultyLayout />
              </ProtectedRoute>
            } 
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="quiz" element={<FacultyQuiz />} />
            <Route path="analytics" element={<FacultyAnalytics />} />
            <Route path="history" element={<FacultyHistory />} />
            <Route path="account" element={<FacultyAccount />} />
          </Route>

          {/* ── Student Portal (sidebar layout) ── */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="quiz" element={<StudentQuiz />} />
            <Route path="chat" element={<StudentChat />} />
            <Route path="analytics" element={<StudentAnalytics />} />
            <Route path="account" element={<StudentAccount />} />
          </Route>

          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/quiz/:link_id" element={<QuizPage />} />
        </Routes>
      </main>
      {!isPortal && !isLogin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center min-h-[82vh] gap-10 text-center px-4"
    >

      {/* Hero */}
      <motion.div variants={itemVariants} className="space-y-4 max-w-2xl mt-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-900/40 dark:border-indigo-800 rounded-full text-xs dark:text-indigo-300 font-medium mb-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        >
          ✨ Powered by Groq · LLaMA 3.3 · FAISS
        </motion.div>
        <h1 className="text-5xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-sm">
            AI-Powered
          </span>
          <br />Academic Assistant
        </h1>
        <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-lg">
          Faculty upload PDFs → Students get instant answers + AI-generated MCQ quizzes, all grounded in your actual course material.
        </p>
      </motion.div>

      {/* CTA cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
        <Link to="/login" className="block">
          <motion.div 
            whileHover={{ scale: 1.03, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 hover:border-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] rounded-2xl p-6 text-left transition-all duration-300 space-y-3 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-600/30 transition-colors">🏫</div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors text-lg">Faculty Portal</p>
            <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed">Upload PDFs, generate AI quizzes, and share secure links directly with your students.</p>
          </motion.div>
        </Link>

        <Link to="/login" className="block">
          <motion.div 
            whileHover={{ scale: 1.03, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 hover:border-pink-500 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] rounded-2xl p-6 text-left transition-all duration-300 space-y-3 h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-2xl group-hover:bg-pink-200 dark:group-hover:bg-pink-600/30 transition-colors">📝</div>
            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors text-lg">Student Portal</p>
            <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed">View your quiz performance, personalized analytics, and subject mastery over time.</p>
          </motion.div>
        </Link>
      </motion.div>

      {/* Feature chips */}
      <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 text-xs text-gray-600 dark:text-gray-500 mt-8 mb-10">
        {['RAG-powered answers', 'Source citations', 'MCQ quiz generation', 'Shareable quiz links', 'Groq LLaMA 3.3', 'FAISS vector search'].map((f, i) => (
          <motion.span 
            key={f} 
            whileHover={{ scale: 1.05 }}
            className="px-4 py-1.5 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-full transition-colors cursor-default hover:text-indigo-600 hover:border-indigo-300 dark:hover:text-gray-200 dark:hover:border-indigo-500"
          >
            {f}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  )
}
