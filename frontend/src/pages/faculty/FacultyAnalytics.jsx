import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  BarChart3, Users, TrendingUp, Award, Loader2, Brain,
  ArrowUp, ArrowDown, Calendar, Download
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { API_URL as API } from '../../config'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}%</p>)}
    </div>
  )
}

function Grade({ v }) {
  const g = v >= 90 ? { l:'A+', c:'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20' }
    : v >= 80 ? { l:'A',  c:'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-400/10 dark:border-green-400/20' }
    : v >= 70 ? { l:'B',  c:'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20' }
    : v >= 60 ? { l:'C',  c:'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-400/10 dark:border-orange-400/20' }
    :           { l:'F',  c:'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20' }
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${g.c}`}>{g.l}</span>
}

const COLORS = ['#818cf8','#c084fc','#f472b6','#34d399','#fbbf24','#60a5fa']

export default function FacultyAnalytics() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return
    axios.get(`${API}/analytics`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => setAnalytics(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600 dark:text-gray-500">
        <Loader2 className="w-7 h-7 animate-spin text-pink-600 dark:text-pink-400" />
        <p className="text-sm">Loading analytics…</p>
      </div>
    )

  if (!analytics || (analytics.students.length === 0 && analytics.subjects.length === 0))
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <motion.div animate={{ y: [0,-10,0] }} transition={{ repeat: Infinity, duration: 3.5 }}>
          <BarChart3 className="w-14 h-14 text-gray-700 mx-auto" />
        </motion.div>
        <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">No data yet</p>
        <p className="text-gray-600 dark:text-gray-500 text-sm max-w-sm">Student analytics will appear here once they attempt quizzes.</p>
      </div>
    )

  const totalAttempts = analytics.students.reduce((a, s) => a + s.attempts, 0)
  const overallAvg = analytics.students.length
    ? (analytics.students.reduce((a, s) => a + s.avg_percentage, 0) / analytics.students.length).toFixed(1)
    : 0
  const topStudent = [...analytics.students].sort((a,b) => b.avg_percentage - a.avg_percentage)[0]
  const passRate = analytics.students.length
    ? ((analytics.students.filter(s => s.avg_percentage >= 60).length / analytics.students.length) * 100).toFixed(0)
    : 0

  // Pie: pass vs fail
  const pieData = [
    { name: 'Passing (≥60%)', value: analytics.students.filter(s => s.avg_percentage >= 60).length },
    { name: 'Failing (<60%)', value: analytics.students.filter(s => s.avg_percentage < 60).length },
  ].filter(d => d.value > 0)

  function handleDownload() {
    const headers = ['Student Name', 'Quizzes Taken', 'Overall Avg (%)', 'Grade']
    const rows = analytics.students.map(s => {
      let grade = 'F'
      if (s.avg_percentage >= 90) grade = 'A+'
      else if (s.avg_percentage >= 80) grade = 'A'
      else if (s.avg_percentage >= 70) grade = 'B'
      else if (s.avg_percentage >= 60) grade = 'C'

      return [
        `"${s.name}"`,
        s.attempts,
        s.avg_percentage,
        grade
      ].join(',')
    })
    
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'faculty_student_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      <motion.div variants={item} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-pink-600 dark:text-pink-400" /> Analytics & Reports
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">Student performance insights across all quizzes.</p>
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
        {[
          { label: 'Total Students',  value: analytics.students.length, icon: Users,      g:'from-indigo-500/10', b:'border-indigo-500/20', c:'text-indigo-600 dark:text-indigo-400' },
          { label: 'Total Attempts',  value: totalAttempts,              icon: Brain,      g:'from-purple-500/10', b:'border-purple-500/20', c:'text-purple-600 dark:text-purple-400' },
          { label: 'Class Average',   value: `${overallAvg}%`,           icon: TrendingUp, g:'from-pink-500/10',   b:'border-pink-500/20',   c:'text-pink-600 dark:text-pink-400'   },
          { label: 'Pass Rate',       value: `${passRate}%`,             icon: Award,      g:'from-green-500/10',  b:'border-green-500/20',  c:'text-green-600 dark:text-green-400'  },
        ].map(s => {
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

      {/* Charts row */}
      <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Student leaderboard bar */}
        <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Student Leaderboard</h2>
          </div>
          <div className="h-56 overflow-x-auto overflow-y-hidden">
            <div className="min-w-[400px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...analytics.students].sort((a,b) => b.avg_percentage - a.avg_percentage).slice(0,7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" domain={[0,100]} stroke="#6b7280" tick={{ fill:'#6b7280', fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fill:'#e5e7eb', fontSize:11 }} width={70} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avg_percentage" name="Avg Score" radius={[0,4,4,0]} maxBarSize={26}>
                  {analytics.students.map((e, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Pass/fail pie */}
        <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Pass / Fail Split</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#34d399' : '#f87171'} />)}
                </Pie>
                <Legend wrapperStyle={{ color:'#9ca3af', fontSize:12 }} />
                <Tooltip contentStyle={{ backgroundColor:'#111827', borderColor:'#374151', borderRadius:'12px', fontSize:'12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Subject averages */}
      {analytics.subjects.length > 0 && (
        <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Average Score by Subject</h2>
          </div>
          <div className="h-52 overflow-x-auto overflow-y-hidden">
            <div className="min-w-[400px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.subjects} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill:'#6b7280', fontSize:11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0,100]} stroke="#6b7280" tick={{ fill:'#6b7280', fontSize:11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avg_percentage" name="Avg Score" radius={[6,6,0,0]} maxBarSize={48}>
                  {analytics.subjects.map((e, i) => (
                    <Cell key={i} fill={e.avg_percentage >= 80 ? '#34d399' : e.avg_percentage >= 60 ? '#fbbf24' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Detailed student table */}
      <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Detailed Student Report</h2>
          <span className="ml-auto text-xs text-gray-600 dark:text-gray-500">{analytics.students.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white dark:bg-gray-800/50">
              <tr>
                {['#', 'Student', 'Quizzes Taken', 'Overall Avg', 'Grade'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
              {[...analytics.students].sort((a,b) => b.avg_percentage - a.avg_percentage).map((s, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-500 text-xs font-bold">{i + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-gray-900 dark:text-white shrink-0">
                      {s.name.slice(0,2).toUpperCase()}
                    </div>
                    {s.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-500 dark:text-gray-400">{s.attempts}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[80px] h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          s.avg_percentage >= 80 ? 'bg-green-400' : s.avg_percentage >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} style={{ width: `${s.avg_percentage}%` }} />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{s.avg_percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Grade v={s.avg_percentage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
