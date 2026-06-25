import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  BookOpen, Users, Brain, History, TrendingUp,
  ArrowRight, Loader2, Sparkles, CheckCircle2, Clock,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { API_URL as API } from '../../config'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-gray-900 dark:text-white">{payload[0].value}%</p>
    </div>
  )
}

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return
    const h = { headers: { Authorization: `Bearer ${user.token}` } }
    Promise.all([
      axios.get(`${API}/subjects`, h).then(r => setSubjects(r.data)).catch(() => {}),
      axios.get(`${API}/analytics`, h).then(r => setAnalytics(r.data)).catch(() => {}),
      axios.get(`${API}/quizzes`, h).then(r => setQuizzes(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '☀️ Good morning' : hour < 17 ? '🌤️ Good afternoon' : '🌙 Good evening'

  const totalStudents = analytics?.students?.length ?? 0
  const totalAttempts = analytics?.students?.reduce((a, s) => a + s.attempts, 0) ?? 0
  const overallAvg = analytics?.students?.length
    ? (analytics.students.reduce((a, s) => a + s.avg_percentage, 0) / analytics.students.length).toFixed(1)
    : 0

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 dark:text-gray-500">
        <Loader2 className="w-7 h-7 animate-spin text-purple-600 dark:text-purple-400" />
        <p className="text-sm">Loading your dashboard…</p>
      </div>
    )

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      {/* Welcome */}
      <motion.div variants={item} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-500 mb-1">{greeting}</p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Hi, <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">{user?.username}!</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1 text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Here's your teaching overview for today.
          </p>
        </div>
        <Link to="/faculty/quiz"
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95"
        >
          <Brain className="w-4 h-4" /> Generate Quiz
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Subjects',       value: subjects.length, icon: BookOpen, g: 'from-indigo-500/10', b: 'border-indigo-500/20', c: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Quizzes Created', value: quizzes.length, icon: Brain,   g: 'from-purple-500/10', b: 'border-purple-500/20', c: 'text-purple-600 dark:text-purple-400' },
          { label: 'Students',       value: totalStudents,   icon: Users,   g: 'from-cyan-500/10',   b: 'border-cyan-500/20',   c: 'text-cyan-600 dark:text-cyan-400'   },
          { label: 'Total Attempts', value: totalAttempts,  icon: TrendingUp, g: 'from-pink-500/10', b: 'border-pink-500/20',   c: 'text-pink-600 dark:text-pink-400'   },
        ].map((s) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} variants={item} whileHover={{ y: -4 }}
              className={`bg-gradient-to-br ${s.g} to-transparent border ${s.b} rounded-2xl p-5 flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
                <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 ${s.c}`}><Icon className="w-4 h-4" /></div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts */}
      {analytics && (
        <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student leaderboard */}
          <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Top Students</h2>
            </div>
            {analytics.students.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No attempts yet.</p>
            ) : (
              <div className="h-52 overflow-x-auto overflow-y-hidden">
                <div className="min-w-[400px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...analytics.students].sort((a,b) => b.avg_percentage - a.avg_percentage).slice(0,5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" domain={[0,100]} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fill: '#e5e7eb', fontSize: 11 }} width={70} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="avg_percentage" name="Avg Score" radius={[0,4,4,0]} maxBarSize={28}>
                      {analytics.students.slice(0,5).map((e, i) => (
                        <Cell key={i} fill={e.avg_percentage >= 80 ? '#818cf8' : '#c084fc'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>

          {/* Subject averages */}
          <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Subject Averages</h2>
            </div>
            {analytics.subjects.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No data yet.</p>
            ) : (
              <div className="h-52 overflow-x-auto overflow-y-hidden">
                <div className="min-w-[400px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.subjects} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0,100]} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="avg_percentage" name="Avg Score" fill="#f472b6" radius={[6,6,0,0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Recent quizzes */}
      <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-600 dark:text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Quizzes</h2>
          </div>
          <Link to="/faculty/history" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {quizzes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Brain className="w-10 h-10 text-gray-700 mx-auto" />
            <p className="text-gray-600 dark:text-gray-500 text-sm">No quizzes created yet.</p>
            <Link to="/faculty/quiz" className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2">Create your first quiz →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {quizzes.slice(0,5).map((q, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white dark:bg-gray-800/20 transition-colors">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{q.subject}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {new Date(q.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-600 dark:text-gray-500 dark:text-gray-400">{q.num_questions} Qs</p>
                  <a href={`/quiz/${q.link_id}`} target="_blank" rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Preview →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick links */}
      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/faculty/quiz',     icon: Brain,    c: 'text-purple-400', bg: 'bg-purple-500/10', b: 'border-purple-500/20 hover:border-purple-500/50', label: 'Generate Quiz',     desc: 'Create AI-powered MCQ quizzes' },
          { to: '/faculty/analytics', icon: TrendingUp, c: 'text-pink-400', bg: 'bg-pink-500/10',  b: 'border-pink-500/20 hover:border-pink-500/50',     label: 'View Analytics',   desc: 'Student performance insights'  },
          { to: '/faculty/history',  icon: History,  c: 'text-cyan-400',  bg: 'bg-cyan-500/10',   b: 'border-cyan-500/20 hover:border-cyan-500/50',    label: 'Quiz History',     desc: 'All quizzes you\'ve created'   },
        ].map((card) => {
          const Icon = card.icon
          return (
            <motion.div key={card.to} variants={item}>
              <Link to={card.to} className={`flex items-center gap-4 bg-gray-50 dark:bg-gray-900/60 border ${card.b} rounded-2xl p-5 hover:bg-gray-50 dark:bg-gray-900/80 transition-all duration-200 group`}>
                <div className={`p-3 rounded-xl ${card.bg} ${card.c} shrink-0`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-indigo-200 transition-colors">{card.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{card.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-600 dark:text-gray-500 dark:text-gray-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
