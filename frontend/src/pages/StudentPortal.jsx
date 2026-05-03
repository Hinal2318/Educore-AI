import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const API = 'http://127.0.0.1:8000'

export default function StudentPortal() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user && user.token) {
      setLoading(true)
      axios.get(`${API}/student/results`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
        .then(({ data }) => setResults(data))
        .catch(err => setError('Failed to load results'))
        .finally(() => setLoading(false))
    }
  }, [user])

  // Dashboard View
  const averageScore = results.length ? (results.reduce((acc, r) => acc + r.percentage, 0) / results.length).toFixed(1) : 0
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
  
  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-5xl mx-auto px-4 py-10 space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold text-pink-300">Welcome, {user?.username}!</h2>
            <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">Here is your personal analytics dashboard.</p>
         </div>
      </motion.div>

      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-500">Loading your data...</p>
      ) : results.length === 0 ? (
        <div className="text-center bg-gray-50 dark:bg-gray-900 py-12 rounded-2xl border border-gray-200 dark:border-gray-800">
           <p className="text-gray-600 dark:text-gray-500 dark:text-gray-400">You haven't taken any quizzes yet.</p>
        </div>
      ) : (
        <>
            {/* Top Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <motion.div whileHover={{ y: -5 }} className="bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm hover:border-pink-500/30 transition-colors">
                 <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400">Total Quizzes Taken</p>
                 <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{results.length}</p>
               </motion.div>
               <motion.div whileHover={{ y: -5 }} className="bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm hover:border-pink-500/30 transition-colors">
                 <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400">Average Score</p>
                 <p className="text-3xl font-bold text-pink-400 mt-1">{averageScore}%</p>
               </motion.div>
               <motion.div whileHover={{ y: -5 }} className="bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm hover:border-pink-500/30 transition-colors">
                 <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400">Strongest Subject</p>
                 <p className="text-xl font-bold text-indigo-300 mt-1 truncate">
                    {
                      [...results].sort((a,b) => b.percentage - a.percentage)[0].subject
                    }
                 </p>
               </motion.div>
            </motion.div>

            {/* Chart */}
            <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Performance Overview</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="subject" stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip cursor={{fill: '#1F2937'}} contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px'}} />
                    <Bar dataKey="percentage" name="Score (%)" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {
                        results.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.percentage >= 80 ? '#34D399' : entry.percentage >= 50 ? '#FBBF24' : '#F87171'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            
            {/* History Table */}
            <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Quiz History</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400">
                   <thead className="bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-500 uppercase">
                     <tr>
                       <th className="px-6 py-3 font-medium">Date</th>
                       <th className="px-6 py-3 font-medium">Subject</th>
                       <th className="px-6 py-3 font-medium">Score</th>
                       <th className="px-6 py-3 font-medium">Percentage</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-800">
                     {results.map((r, i) => (
                       <tr key={`${r.id}-${i}`} className="hover:bg-white dark:bg-gray-800/30 transition-colors">
                         <td className="px-6 py-4 whitespace-nowrap">{r.date ? new Date(r.date + 'Z').toLocaleDateString() : 'Just now'}</td>
                         <td className="px-6 py-4 text-gray-200">{r.subject}</td>
                         <td className="px-6 py-4">{r.score} / {r.total}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.percentage >= 80 ? 'bg-green-900/40 text-green-400' : r.percentage >= 50 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
                              {r.percentage}%
                            </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </motion.div>
        </>
      )}
    </motion.div>
  )
}
