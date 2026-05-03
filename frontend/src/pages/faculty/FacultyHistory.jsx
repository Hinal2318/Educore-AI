import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  History, Brain, Clock, Copy, ExternalLink,
  CheckCircle2, Loader2, Search, HelpCircle,
} from 'lucide-react'

const API = 'http://127.0.0.1:8000'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

function DiffBadge({ n }) {
  const d = n <= 5 ? { l:'Easy', c:'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-400/10 dark:border-green-400/20' }
    : n <= 10 ? { l:'Medium', c:'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20' }
    : { l:'Hard', c:'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20' }
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${d.c}`}>{d.l}</span>
}

export default function FacultyHistory() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (!user?.token) return
    axios.get(`${API}/quizzes`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => setQuizzes(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const filtered = quizzes.filter(q =>
    q.subject?.toLowerCase().includes(search.toLowerCase())
  )

  function copyLink(q) {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${q.link_id}`)
    setCopiedId(q.link_id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 dark:text-gray-500">
        <Loader2 className="w-7 h-7 animate-spin text-cyan-600 dark:text-cyan-400" />
        <p className="text-sm">Loading quiz history…</p>
      </div>
    )

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto px-6 py-8 space-y-7">

      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-600 dark:text-cyan-400" /> Quiz History
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">All quizzes you've created. Students can access them on their quiz page.</p>
        </div>
        {!loading && (
          <div className="shrink-0 px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-700 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-300 font-medium">
            {filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''} total
          </div>
        )}
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="flex items-center gap-2 bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 rounded-xl px-4 py-2.5 transition-all">
        <Search className="w-4 h-4 text-gray-600 dark:text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Search by subject…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none w-full"
        />
      </motion.div>

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl py-16 text-center space-y-3">
          <motion.div animate={{ y: [0,-10,0] }} transition={{ repeat: Infinity, duration: 3.5 }}>
            <Brain className="w-12 h-12 text-gray-700 mx-auto" />
          </motion.div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">{search ? 'No quizzes match your search' : 'No quizzes created yet'}</p>
          <p className="text-gray-600 dark:text-gray-500 text-sm">{search ? 'Try a different subject name.' : 'Go to Quiz Builder to generate your first quiz.'}</p>
        </motion.div>
      ) : (
        <motion.div variants={container} className="space-y-3">
          {filtered.map((q, i) => (
            <motion.div
              key={q.id ?? i}
              variants={item}
              className="bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 hover:border-cyan-500/30 rounded-2xl p-5 flex items-center gap-5 transition-all duration-200 group"
            >
              {/* Icon */}
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 shrink-0">
                <Brain className="w-5 h-5" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-cyan-600 dark:group-hover:text-cyan-200 transition-colors">{q.subject}</p>
                  <DiffBadge n={q.num_questions} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> {q.num_questions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <code className="text-[10px] text-gray-600 font-mono truncate max-w-[260px]">
                    /quiz/{q.link_id}
                  </code>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => copyLink(q)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    copiedId === q.link_id
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/15 dark:border-green-500/30 dark:text-green-300'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-cyan-500 dark:hover:border-cyan-500/40 hover:text-cyan-600 dark:hover:text-cyan-300'
                  }`}
                >
                  {copiedId === q.link_id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === q.link_id ? 'Copied!' : 'Copy'}
                </motion.button>
                <a href={`/quiz/${q.link_id}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-600/10 dark:border-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-600/20 dark:hover:text-indigo-300 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Preview
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
