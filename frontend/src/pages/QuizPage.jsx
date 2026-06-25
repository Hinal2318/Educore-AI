import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { API_URL as API } from '../config'

export default function QuizPage() {
  const { link_id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // One-at-a-time flow
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState([])       // chosen letter per question
  const [selected, setSelected] = useState('')     // currently highlighted option
  const [submitted, setSubmitted] = useState(false)
  const [started, setStarted] = useState(false)
  const [scoreData, setScoreData] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    axios.get(`${API}/quiz/${link_id}`)
      .then(({ data }) => {
        setQuiz(data)
        setAnswers(new Array(data.questions.length).fill(''))
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Quiz not found.')
        setLoading(false)
      })
  }, [link_id])

  function handleSelect(letter) {
    setSelected(letter)
  }

  function handleNext() {
    if (!selected) return
    const newAnswers = [...answers]
    newAnswers[currentQ] = selected
    setAnswers(newAnswers)
    setSelected('')

    if (currentQ + 1 < quiz.questions.length) {
      setCurrentQ(currentQ + 1)
    } else {
      submitQuiz(newAnswers)
    }
  }

  async function submitQuiz(finalAnswers) {
    if (!user || user.role !== 'student') {
      setError('You must be logged in as a student to submit a quiz.');
      return;
    }
    
    setSubmitting(true)
    try {
      const payload = { answers: finalAnswers }
      const { data } = await axios.post(`${API}/quiz/${link_id}/submit`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setScoreData(data)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed.')
    } finally {
      setSubmitting(false)
    }
  }

  function retake() {
    setCurrentQ(0)
    setAnswers(new Array(quiz.questions.length).fill(''))
    setSelected('')
    setSubmitted(false)
    setScoreData(null)
  }

  // ── Loading / Error states ────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm">Loading quiz…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-red-900/30 border border-red-700 rounded-2xl px-8 py-8 text-center max-w-md space-y-3">
        <p className="text-4xl">❌</p>
        <p className="text-red-300 font-medium">{error}</p>
        <Link to="/" className="block text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white">← Back to home</Link>
      </div>
    </div>
  )

  // ── Pre-quiz screen ──────────────────────────────────────
  if (!started && !submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[70vh]"
      >
        <div className="bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl px-8 py-8 text-center max-w-md space-y-5 w-full shadow-lg">
          <p className="text-4xl">📝</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.subject} Quiz</h2>
          <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm">
             {(!user || user.role !== 'student') 
               ? 'You must be signed in as a student to take this quiz.'
               : `Ready to test your knowledge, ${user.username}?`}
          </p>
          
          {(!user || user.role !== 'student') ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
            >
              Sign In to Start
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStarted(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
            >
              Start Quiz
            </motion.button>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Score screen ─────────────────────────────────────────
  if (submitted && scoreData) {
    const pct = scoreData.percentage
    const grade = pct >= 80 ? { emoji: '🏆', label: 'Excellent!', color: 'text-yellow-400' }
                : pct >= 60 ? { emoji: '✅', label: 'Good job!', color: 'text-green-400' }
                :              { emoji: '📚', label: 'Keep studying', color: 'text-red-400' }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-2xl mx-auto px-4 py-10 space-y-6"
      >
        <div className={`rounded-2xl p-8 text-center border space-y-2 shadow-lg ${
          pct >= 60 ? 'bg-green-900/20 border-green-800/50 shadow-green-900/10' : 'bg-red-900/20 border-red-800/50 shadow-red-900/10'
        }`}>
          <motion.p 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-5xl"
          >
            {grade.emoji}
          </motion.p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{scoreData.score} / {scoreData.total}</p>
          <p className={`text-2xl font-bold ${grade.color}`}>{pct}%</p>
          <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm">{grade.label} — {quiz.subject}</p>
        </div>

        <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-base">Review Answers</h3>
        <div className="space-y-4">
          {scoreData.results.map((r, i) => (
            <div key={i} className={`rounded-2xl p-5 border space-y-2 ${
              r.is_correct ? 'bg-green-900/15 border-green-800' : 'bg-red-900/15 border-red-800'
            }`}>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                <span className={`font-bold mr-2 ${r.is_correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {r.is_correct ? '✓' : '✗'} Q{i + 1}.
                </span>
                {r.question}
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-full">
                  Your answer: {r.your_answer}
                </span>
                {!r.is_correct && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full">
                    Correct: {r.correct_answer}
                  </span>
                )}
              </div>
              {r.explanation && (
                <p className="text-xs text-gray-600 dark:text-gray-500 dark:text-gray-400 border-t border-gray-300 dark:border-gray-700 pt-2 mt-1">
                  <span className="text-yellow-400 font-semibold">💡 </span>{r.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={retake}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-sm transition-colors shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
          >
            Retake Quiz
          </motion.button>
          <Link
            to="/student"
            className="flex-1 py-3 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold text-sm text-center transition-colors shadow-sm block"
          >
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── One-at-a-time quiz ────────────────────────────────────
  const q = quiz.questions[currentQ]
  const optionLetters = ['A', 'B', 'C', 'D']
  const progress = ((currentQ) / quiz.questions.length) * 100
  const isLast = currentQ === quiz.questions.length - 1

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center py-10 px-4">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-3xl space-y-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              {quiz.subject}
            </h2>
            <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 font-medium tracking-wide text-sm">
              Question <span className="text-gray-900 dark:text-white">{currentQ + 1}</span> of {quiz.questions.length}
            </p>
          </div>
          
          {/* Circular Progress Indicator (Optional but looks cool, replacing pill dots) */}
          <div className="flex gap-1.5 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-2xl border border-gray-200 dark:border-gray-800">
            {quiz.questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i < currentQ
                    ? 'w-4 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                    : i === currentQ
                      ? 'w-8 bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]'
                      : 'w-3 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar (Main) */}
        <div className="w-full h-1.5 bg-white dark:bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* Question Card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQ}
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-300 dark:border-gray-700/50 rounded-[2rem] p-8 md:p-10 space-y-8 shadow-2xl shadow-indigo-900/20"
            >
              <h3 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                {q.question}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {q.options.map((opt, oi) => {
                  const letter = optionLetters[oi]
                  const isSelected = selected === letter
                  
                  // Clean up LLM output that might already contain "A. " or "A) "
                  const cleanOpt = opt.replace(/^[A-D][.)]\s*/i, '')

                  return (
                    <motion.button
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      key={oi}
                      id={`opt-${letter}`}
                      onClick={() => handleSelect(letter)}
                      className={`relative group flex items-center w-full text-left p-4 md:p-5 rounded-2xl text-base md:text-lg border-2 transition-all duration-200 overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-600/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                          : 'bg-white dark:bg-gray-800/40 border-gray-300 dark:border-gray-700 hover:border-indigo-400/50 hover:bg-gray-50 dark:hover:bg-gray-800/80'
                      }`}
                    >
                      {/* Active glow inside button */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                      )}
                      
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-5 shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-300'
                      }`}>
                        <span className="font-bold">{letter}</span>
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {cleanOpt}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: selected ? 1.03 : 1 }}
                  whileTap={{ scale: selected ? 0.97 : 1 }}
                  id="next-btn"
                  onClick={handleNext}
                  disabled={!selected || submitting}
                  className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center gap-2 ${
                    !selected 
                      ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700' 
                      : 'bg-gray-900 text-white dark:bg-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-indigo-50 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]'
                  }`}
                >
                  {submitting ? (
                    'Submitting...'
                  ) : isLast ? (
                    'Submit Quiz ✓'
                  ) : (
                    <>Next Question <span className="text-xl leading-none">→</span></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
