import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  BookOpen, Trophy, Target, Flame, TrendingUp,
  ClipboardList, MessageSquare, BarChart3,
  ArrowRight, Calendar, CheckCircle2, XCircle, MinusCircle,
  Loader2, Sparkles,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

const API = 'http://127.0.0.1:8000'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

function StatCard({ label, value, sub, icon: Icon, gradient, border, iconColor }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-600 dark:text-gray-500">{sub}</p>}
    </motion.div>
  )
}

function ScoreIcon({ pct }) {
  if (pct >= 80) return <CheckCircle2 className="w-5 h-5 text-green-400" />
  if (pct >= 50) return <MinusCircle className="w-5 h-5 text-yellow-400" />
  return <XCircle className="w-5 h-5 text-red-400" />
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs shadow-xl">
        <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="font-bold text-gray-900 dark:text-white">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.token) {
      axios
        .get(`${API}/student/results`, { headers: { Authorization: `Bearer ${user.token}` } })
        .then(({ data }) => setResults(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user])

  const avg = results.length
    ? (results.reduce((a, r) => a + r.percentage, 0) / results.length).toFixed(1)
    : 0
  const best = results.length
    ? [...results].sort((a, b) => b.percentage - a.percentage)[0]
    : null
  const recent = [...results].slice(-5).reverse()

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? '☀️ Good morning' : hour < 17 ? '🌤️ Good afternoon' : '🌙 Good evening'

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 dark:text-gray-500">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm">Loading your dashboard…</p>
      </div>
    )

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto px-6 py-8 space-y-8"
    >
      {/* ── Welcome ── */}
      <motion.div variants={item} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-500 mb-1">{greeting}</p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Hi, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{user?.username}!</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1 text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Here's your academic overview for today.
          </p>
        </div>
        <Link
          to="/student/quiz"
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
        >
          <ClipboardList className="w-4 h-4" />
          Take a Quiz
        </Link>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Quizzes Taken"
          value={results.length}
          sub="All time"
          icon={BookOpen}
          gradient="from-indigo-500/10 to-indigo-600/5"
          border="border-indigo-500/20"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label="Average Score"
          value={`${avg}%`}
          sub="Across all quizzes"
          icon={Target}
          gradient="from-pink-500/10 to-pink-600/5"
          border="border-pink-500/20"
          iconColor="text-pink-600 dark:text-pink-400"
        />
        <StatCard
          label="Best Subject"
          value={best?.subject ?? '—'}
          sub={best ? `Top score: ${best.percentage}%` : 'No data yet'}
          icon={Trophy}
          gradient="from-amber-500/10 to-amber-600/5"
          border="border-amber-500/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Study Streak"
          value={results.length > 0 ? `${Math.min(results.length, 7)}d` : '—'}
          sub="Keep going!"
          icon={Flame}
          gradient="from-green-500/10 to-green-600/5"
          border="border-green-500/20"
          iconColor="text-green-600 dark:text-green-400"
        />
      </motion.div>

      {/* ── Chart ── */}
      {results.length > 0 && (
        <motion.div
          variants={item}
          className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Overview</h2>
          </div>
          <div className="h-52 overflow-x-auto overflow-y-hidden">
            <div className="min-w-[500px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="subject" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="percentage" name="Score (%)" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {results.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.percentage >= 80 ? '#34d399' : entry.percentage >= 50 ? '#fbbf24' : '#f87171'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ── Recent activity ── */}
      <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <Link
            to="/student/analytics"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors font-medium"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <ClipboardList className="w-10 h-10 text-gray-700 mx-auto" />
            <p className="text-gray-600 dark:text-gray-500 text-sm">No quiz attempts yet.</p>
            <Link
              to="/student/quiz"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Take your first quiz <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {recent.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white dark:bg-gray-800/30 transition-colors group"
              >
                <ScoreIcon pct={r.percentage} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">{r.subject}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {r.date ? new Date(r.date + 'Z').toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{r.score}/{r.total}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.percentage >= 80 ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                    r.percentage >= 50 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                    'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  }`}>
                    {r.percentage}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Quick links ── */}
      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            to: '/student/chat',
            icon: MessageSquare,
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20 hover:border-cyan-500/50',
            label: 'Ask AI Tutor',
            desc: 'Get answers from course material',
          },
          {
            to: '/student/quiz',
            icon: ClipboardList,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20 hover:border-purple-500/50',
            label: 'Take a Quiz',
            desc: 'Practice with assigned quizzes',
          },
          {
            to: '/student/analytics',
            icon: BarChart3,
            iconColor: 'text-pink-600 dark:text-pink-400',
            bg: 'bg-pink-500/10',
            border: 'border-pink-500/20 hover:border-pink-500/50',
            label: 'View Analytics',
            desc: 'Deep dive into performance',
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <motion.div key={card.to} variants={item}>
              <Link
                to={card.to}
                className={`flex items-center gap-4 bg-gray-50 dark:bg-gray-900/60 border ${card.border} rounded-2xl p-5 hover:shadow-lg hover:bg-gray-50 dark:bg-gray-900/80 transition-all duration-200 group`}
              >
                <div className={`p-3 rounded-xl ${card.bg} ${card.iconColor} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">{card.label}</p>
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
