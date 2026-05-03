import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  Target, TrendingUp, TrendingDown, CheckCircle2, BarChart3,
  Loader2, ClipboardList, Calendar, Award, ArrowUp, ArrowDown, Download, Sparkles, Lightbulb, Zap, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts'

const API = 'http://127.0.0.1:8000'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

function Grade({ value }) {
  const g =
    value >= 90 ? { l: 'A+', c: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20' } :
    value >= 80 ? { l: 'A',  c: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-400/10 dark:border-green-400/20' } :
    value >= 70 ? { l: 'B',  c: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20' } :
    value >= 60 ? { l: 'C',  c: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-400/20' } :
                  { l: 'F',  c: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20' }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${g.c}`}>{g.l}</span>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}%</p>
      ))}
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, sub, gradient, border, iconColor, trend }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      className={`bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-5 space-y-3 transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600 dark:text-gray-500">{sub}</p>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {trend >= 0
              ? <ArrowUp className="w-3 h-3" />
              : <ArrowDown className="w-3 h-3" />
            }
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  )
}

function AiInsights({ user }) {
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const fetchSuggestions = () => {
    setLoading(true)
    setHasStarted(true)
    axios
      .get(`${API}/student/ai-suggestions`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => setSuggestions(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  if (!hasStarted) {
    return (
      <motion.div 
        variants={item}
        className="bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-transparent border border-indigo-500/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-6"
      >
        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">Unlock AI Study Insights</h2>
          <p className="text-sm text-gray-600 dark:text-gray-500">
            Let KNOA analyze your performance and provide personalized recommendations to boost your academic growth.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchSuggestions}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Sparkles className="w-5 h-5" />
          Generate AI Suggestions
        </motion.button>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <motion.div variants={item} className="bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="p-4 rounded-2xl bg-indigo-500/10"
        >
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </motion.div>
        <div className="text-center">
          <p className="text-gray-900 dark:text-white font-bold text-lg mb-1">KNOA is analyzing your performance...</p>
          <p className="text-gray-600 dark:text-gray-500 text-sm">Crafting personalized study recommendations just for you.</p>
        </div>
      </motion.div>
    )
  }

  if (!suggestions || !suggestions.suggestions?.length) return null

  return (
    <motion.div variants={item} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-outfit">AI Study Insights</h2>
        </div>
        <button
          onClick={fetchSuggestions}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-500"
          title="Refresh Insights"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Sparkles className="w-32 h-32" />
        </div>
        
        <p className="text-gray-800 dark:text-gray-200 font-medium italic mb-6 leading-relaxed relative z-10">
          "{suggestions.summary}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.suggestions.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 rounded-xl p-4 flex gap-4"
            >
              <div className={`mt-1 p-2 rounded-lg h-fit ${
                s.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                s.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-emerald-500/10 text-emerald-400'
              }`}>
                {s.priority === 'high' ? <Zap className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{s.topic}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    s.priority === 'high' ? 'bg-red-400/10 text-red-400' :
                    s.priority === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-emerald-400/10 text-emerald-400'
                  }`}>
                    {s.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {s.advice}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function StudentAnalytics() {
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

  // ── Derived metrics ──
  const avg = results.length
    ? +(results.reduce((a, r) => a + r.percentage, 0) / results.length).toFixed(1) : 0
  const highest = results.length ? Math.max(...results.map(r => r.percentage)) : 0
  const lowest  = results.length ? Math.min(...results.map(r => r.percentage)) : 0
  const passing = results.filter(r => r.percentage >= 60).length
  const passRate = results.length ? +((passing / results.length) * 100).toFixed(0) : 0

  // trend: compare last half vs first half
  const mid = Math.floor(results.length / 2)
  const firstHalf = results.slice(0, mid)
  const secondHalf = results.slice(mid)
  const firstAvg = firstHalf.length ? firstHalf.reduce((a, r) => a + r.percentage, 0) / firstHalf.length : 0
  const secondAvg = secondHalf.length ? secondHalf.reduce((a, r) => a + r.percentage, 0) / secondHalf.length : 0
  const trend = results.length >= 4 ? +(secondAvg - firstAvg).toFixed(1) : undefined

  // Subject aggregation
  const subjectMap = {}
  results.forEach(r => {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, count: 0, best: 0 }
    subjectMap[r.subject].total += r.percentage
    subjectMap[r.subject].count += 1
    subjectMap[r.subject].best = Math.max(subjectMap[r.subject].best, r.percentage)
  })
  const subjectData = Object.entries(subjectMap).map(([name, d]) => ({
    subject: name,
    avg: +(d.total / d.count).toFixed(1),
    attempts: d.count,
    best: d.best,
  }))

  // Timeline (last 10)
  const timeline = results.slice(-10).map((r, i) => ({
    attempt: `#${i + 1}`,
    score: r.percentage,
    subject: r.subject,
  }))

  const radarData = subjectData.map(s => ({ subject: s.subject, score: s.avg }))

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 dark:text-gray-500">
        <Loader2 className="w-7 h-7 animate-spin text-pink-600 dark:text-pink-400" />
        <p className="text-sm">Crunching your data…</p>
      </div>
    )

  function handleDownload() {
    const headers = ['Date', 'Subject', 'Score', 'Total', 'Percentage', 'Grade']
    const rows = results.map(r => {
      const date = r.date ? new Date(r.date + 'Z').toLocaleDateString() : 'Just now'
      let grade = 'F'
      if (r.percentage >= 90) grade = 'A+'
      else if (r.percentage >= 80) grade = 'A'
      else if (r.percentage >= 70) grade = 'B'
      else if (r.percentage >= 60) grade = 'C'
      
      return [
        `"${date}"`,
        `"${r.subject}"`,
        r.score,
        r.total,
        `${r.percentage}%`,
        grade
      ].join(',')
    })
    
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'student_performance_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (results.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.5 }}>
          <BarChart3 className="w-14 h-14 text-gray-700 mx-auto" />
        </motion.div>
        <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">No analytics yet</p>
        <p className="text-gray-600 dark:text-gray-500 text-sm max-w-sm">
          Take some quizzes and come back here to see your full performance breakdown.
        </p>
      </div>
    )

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto px-6 py-8 space-y-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            Analytics & Report
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">A full breakdown of your academic performance.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={handleDownload} 
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-gray-900 dark:text-white transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Download className="w-4 h-4" /> Download Report
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Average Score" value={`${avg}%`} icon={Target} sub="All quizzes"
          gradient="from-pink-500/10 to-pink-600/5" border="border-pink-500/20" iconColor="text-pink-600 dark:text-pink-400" trend={trend} />
        <KpiCard label="Highest Score" value={`${highest}%`} icon={TrendingUp} sub="Personal best"
          gradient="from-green-500/10 to-green-600/5" border="border-green-500/20" iconColor="text-green-600 dark:text-green-400" />
        <KpiCard label="Lowest Score" value={`${lowest}%`} icon={TrendingDown} sub="Room to improve"
          gradient="from-red-500/10 to-red-600/5" border="border-red-500/20" iconColor="text-red-600 dark:text-red-400" />
        <KpiCard label="Pass Rate" value={`${passRate}%`} icon={CheckCircle2} sub={`${passing}/${results.length} passed`}
          gradient="from-indigo-500/10 to-indigo-600/5" border="border-indigo-500/20" iconColor="text-indigo-600 dark:text-indigo-400" />
      </motion.div>

      {/* AI Insights */}
      <AiInsights user={user} />

      {/* Charts row */}
      <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar — subject avg */}
        <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Average Score by Subject</h2>
          </div>
          <div className="h-56 overflow-x-auto overflow-y-hidden">
            <div className="min-w-[500px] h-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="subject" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avg" name="Avg Score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {subjectData.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.avg >= 80 ? '#34d399' : entry.avg >= 60 ? '#fbbf24' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Line — trend */}
        <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Score Trend (Last 10)</h2>
          </div>
          <div className="h-56 overflow-x-auto overflow-y-hidden">
            <div className="min-w-[500px] h-full">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="attempt" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="score" name="Score" stroke="#ec4899"
                  strokeWidth={2.5} dot={{ fill: '#ec4899', r: 4 }} activeDot={{ r: 6, fill: '#f9a8d4' }} />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Radar */}
      {radarData.length >= 3 && (
        <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Subject Mastery Radar</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.25} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Subject report card */}
      <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Subject Report Card</h2>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">Aggregated performance per subject</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white dark:bg-gray-800/50">
              <tr>
                {['Subject', 'Attempts', 'Avg Score', 'Best', 'Grade'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {[...subjectData].sort((a, b) => b.avg - a.avg).map((row, i) => (
                <tr key={i} className="hover:bg-white dark:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.subject}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-500 dark:text-gray-400">{row.attempts}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[80px] h-1.5 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          row.avg >= 80 ? 'bg-green-400' : row.avg >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} style={{ width: `${row.avg}%` }} />
                      </div>
                      <span className="text-gray-900 dark:text-gray-300">{row.avg}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-500 dark:text-gray-400">{row.best}%</td>
                  <td className="px-6 py-4"><Grade value={row.avg} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Full history */}
      <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Full Quiz History</h2>
            <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{results.length} total attempts</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white dark:bg-gray-800/50">
              <tr>
                {['Date', 'Subject', 'Score', 'Percentage', 'Grade'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {[...results].reverse().map((r, i) => (
                <tr key={i} className="hover:bg-white dark:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {r.date ? new Date(r.date + 'Z').toLocaleDateString() : 'Just now'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{r.subject}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-500 dark:text-gray-400">{r.score}/{r.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      r.percentage >= 80 ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                      r.percentage >= 60 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                      'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    }`}>{r.percentage}%</span>
                  </td>
                  <td className="px-6 py-4"><Grade value={r.percentage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
