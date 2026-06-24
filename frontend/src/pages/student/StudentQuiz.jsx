import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Search, Play, ClipboardList, Clock, HelpCircle,
  Zap, AlertCircle, Loader2, ChevronRight, Filter,
} from 'lucide-react'

const API = 'http://127.0.0.1:8000'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

function DifficultyBadge({ n }) {
  const { label, cls } =
    n <= 5  ? { label: 'Easy',   cls: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-400/10 dark:border-green-400/20' } :
    n <= 10 ? { label: 'Medium', cls: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20' } :
              { label: 'Hard',   cls: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20' }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

function QuizCard({ quiz, onStart }) {
  const estMins = Math.max(1, Math.round(quiz.num_questions * 1.5))
  
  // Randomize a subtle accent color based on subject string length so it's consistent
  const colors = [
    'from-indigo-500/20 to-purple-500/20',
    'from-blue-500/20 to-cyan-500/20',
    'from-fuchsia-500/20 to-pink-500/20',
    'from-emerald-500/20 to-teal-500/20'
  ];
  const colorIndex = (quiz.subject?.length ?? 0) % colors.length;
  const accentGradient = colors[colorIndex];
  
  const creatorInitial = quiz.created_by ? quiz.created_by.charAt(0).toUpperCase() : 'F';

  return (
    <motion.div
      variants={cardAnim}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative group bg-gray-50 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:border-gray-700 rounded-3xl overflow-hidden transition-all duration-300"
    >
      {/* Dynamic background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative p-6 flex flex-col h-full gap-6">
        
        {/* Top: Title & Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-white dark:group-hover:to-gray-400 transition-all">
              {quiz.subject}
            </h3>
            
            {/* Creator info */}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-300 dark:border-gray-700">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{creatorInitial}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">
                by {quiz.created_by ?? 'Faculty'}
              </p>
            </div>
          </div>
          <div className="shrink-0 mt-1">
            <DifficultyBadge n={quiz.num_questions} />
          </div>
        </div>

        {/* Middle: Stats */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 group-hover:bg-white dark:group-hover:bg-gray-800/60 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-500">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Questions</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white ml-5">{quiz.num_questions}</p>
          </div>
          
          <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 group-hover:bg-white dark:group-hover:bg-gray-800/60 transition-colors">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-500">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Time</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white ml-5">{estMins}m</p>
          </div>
        </div>

        {/* Bottom: Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onStart(quiz.link_id)}
          className="w-full relative overflow-hidden group/btn flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-700 hover:border-gray-600 text-gray-900 dark:text-white text-sm font-semibold rounded-2xl transition-all"
        >
          {/* Subtle animated shine effect on the button */}
          <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
          
          <span className="relative z-10 flex items-center gap-2 group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-300 transition-colors">
            <Play className="w-4 h-4 fill-current" />
            Start Challenge
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-white dark:bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-white dark:bg-gray-800 rounded w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-white dark:bg-gray-800 rounded-xl" />
        <div className="h-16 bg-white dark:bg-gray-800 rounded-xl" />
      </div>
      <div className="h-10 bg-white dark:bg-gray-800 rounded-xl" />
    </div>
  )
}

export default function StudentQuiz() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | easy | medium | hard

  useEffect(() => {
    if (user?.token) {
      axios
        .get(`${API}/quizzes`, { headers: { Authorization: `Bearer ${user.token}` } })
        .then(({ data }) => setQuizzes(Array.isArray(data) ? data : []))
        .catch(() => setError('Could not load quizzes. Please try again.'))
        .finally(() => setLoading(false))
    }
  }, [user])

  const filtered = quizzes.filter((q) => {
    const matchSearch = q.subject?.toLowerCase().includes(search.toLowerCase())
    const n = q.num_questions
    const matchFilter =
      filter === 'all' ? true :
      filter === 'easy' ? n <= 5 :
      filter === 'medium' ? n > 5 && n <= 10 :
      n > 10
    return matchSearch && matchFilter
  })

  function handleStart(linkId) {
    navigate(`/quiz/${linkId}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Available Quizzes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">
            Quizzes published by your teachers appear here.
          </p>
        </div>
        {!loading && !error && (
          <div className="shrink-0 px-3 py-1.5 bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 rounded-xl text-xs dark:text-purple-300 font-medium">
            {filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''} found
          </div>
        )}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 rounded-xl px-4 py-2.5 transition-all">
          <Search className="w-4 h-4 text-gray-600 dark:text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-500 shrink-0" />
          {['all', 'easy', 'medium', 'hard'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all border ${
                filter === f
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:border-gray-600 hover:text-gray-900 dark:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-500/30 rounded-2xl p-5 text-sm dark:text-red-300">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center space-y-4"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            >
              <ClipboardList className="w-12 h-12 text-gray-700 mx-auto" />
            </motion.div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">
              {search || filter !== 'all'
                ? `No quizzes match your filters`
                : 'No quizzes available yet'}
            </p>
            <p className="text-gray-600 dark:text-gray-500 text-sm">
              {search || filter !== 'all'
                ? 'Try clearing the search or filter.'
                : 'Check back after your teacher creates a quiz.'}
            </p>
            {(search || filter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilter('all') }}
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-2 transition-colors"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map((q) => (
            <QuizCard key={q.link_id ?? q.id} quiz={q} onStart={handleStart} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
