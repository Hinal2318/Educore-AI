import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  Brain, Plus, Upload, FileText, CheckCircle2, AlertCircle,
  Loader2, Copy, ExternalLink, Sliders, BookOpen, Sparkles, Hash,
  Settings2, ListChecks, PencilLine, Trash2, ChevronRight, ChevronDown
} from 'lucide-react'
import { API_URL as API } from '../../config'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

function Card({ title, desc, icon: Icon, iconColor, children }) {
  return (
    <motion.section variants={item} className="bg-gray-50 dark:bg-gray-900/70 backdrop-blur border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden transition-colors">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800/60 flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white dark:bg-gray-800/60 ${iconColor}`}><Icon className="w-4 h-4" /></div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          {desc && <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.section>
  )
}

export default function FacultyQuiz() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [newSubject, setNewSubject] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [file, setFile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)
  
  // Quiz Builder State
  const [quizMode, setQuizMode] = useState('auto') // 'auto', 'selective', 'manual'
  const [quizSubject, setQuizSubject] = useState('')
  const [quizN, setQuizN] = useState(10)
  const [quizSemester, setQuizSemester] = useState('')
  const [generating, setGenerating] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [quizError, setQuizError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Selective AI State
  const [previewQuestions, setPreviewQuestions] = useState([])
  const [selectedIndices, setSelectedIndices] = useState([])

  // Manual Entry State
  const [manualQuestions, setManualQuestions] = useState([])
  const [showManualForm, setShowManualForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    answer: 'A',
    explanation: ''
  })

  const h = { headers: { Authorization: `Bearer ${user?.token}` } }

  useEffect(() => { fetchSubjects() }, [user])

  async function fetchSubjects() {
    if (!user?.token) return
    try { const { data } = await axios.get(`${API}/subjects`, h); setSubjects(data) }
    catch (e) { console.error(e) }
  }

  async function fetchDocuments(sid) {
    try { const { data } = await axios.get(`${API}/documents?subject_id=${sid}`, h); setDocuments(data) }
    catch (e) { console.error(e) }
  }

  async function createSubject(e) {
    e.preventDefault()
    if (!newSubject.trim()) return
    try {
      await axios.post(`${API}/subjects`, { name: newSubject }, h)
      setNewSubject('')
      fetchSubjects()
    } catch (e) { console.error(e) }
  }

  function handleSubjectChange(e) {
    setSelectedSubject(e.target.value)
    if (e.target.value) fetchDocuments(e.target.value); else setDocuments([])
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file || !selectedSubject) { setUploadMsg({ type: 'error', text: 'Select a subject and a PDF file first.' }); return }
    setUploading(true); setUploadMsg(null)
    const fd = new FormData()
    fd.append('file', file); fd.append('subject_id', selectedSubject)
    try {
      const { data } = await axios.post(`${API}/upload`, fd, { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } })
      setUploadMsg({ type: 'success', text: `${data.filename} uploaded — ${data.chunks_created} chunks indexed.` })
      fetchDocuments(selectedSubject)
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.response?.data?.detail || 'Upload failed.' })
    } finally { setUploading(false); setFile(null) }
  }

  // --- Quiz Generation Handlers ---

  async function handleAutoGenerate(e) {
    e.preventDefault()
    if (!quizSubject) { setQuizError('Please select a subject.'); return }
    setGenerating(true); setQuizResult(null); setQuizError(null)
    try {
      const query = `?subject_id=${quizSubject}&n=${quizN}${quizSemester ? `&semester=${quizSemester}` : ''}`
      const { data } = await axios.post(`${API}/quiz/generate${query}`, null, h)
      setQuizResult(data)
    } catch (err) {
      setQuizError(err.response?.data?.detail || 'Quiz generation failed.')
    } finally { setGenerating(false) }
  }

  async function handleGetPreview() {
    if (!quizSubject) { setQuizError('Please select a subject.'); return }
    setGenerating(true); setQuizError(null)
    try {
      const { data } = await axios.post(`${API}/quiz/preview?subject_id=${quizSubject}&n=${quizN}`, null, h)
      setPreviewQuestions(data)
      setSelectedIndices(data.map((_, i) => i)) // select all by default
    } catch (err) {
      setQuizError(err.response?.data?.detail || 'Preview failed.')
    } finally { setGenerating(false) }
  }

  async function handleSaveCustomQuiz(questionsToSave) {
    if (!quizSubject) { setQuizError('Please select a subject.'); return }
    if (!questionsToSave.length) { setQuizError('No questions to save.'); return }
    setGenerating(true); setQuizError(null)
    try {
      const payload = {
        subject_id: quizSubject,
        semester: quizSemester ? parseInt(quizSemester) : null,
        questions: questionsToSave
      }
      const { data } = await axios.post(`${API}/quiz/save`, payload, h)
      setQuizResult(data)
      setPreviewQuestions([])
      setManualQuestions([])
    } catch (err) {
      setQuizError(err.response?.data?.detail || 'Saving failed.')
    } finally { setGenerating(false) }
  }

  function addManualQuestion() {
    if (!newQuestion.question.trim()) return
    setManualQuestions([...manualQuestions, { ...newQuestion }])
    setNewQuestion({ question: '', options: ['', '', '', ''], answer: 'A', explanation: '' })
    setShowManualForm(false)
  }

  function toggleIndex(idx) {
    setSelectedIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  function copyLink() {
    const url = `${window.location.origin}/quiz/${quizResult.link_id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const statusColor = s => s === 'ready' ? 'text-green-600 dark:text-green-400' : s === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
  const statusDot = s => s === 'ready' ? 'bg-green-500 dark:bg-green-400' : s === 'failed' ? 'bg-red-500 dark:bg-red-400' : 'bg-yellow-500 dark:bg-yellow-400'

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto px-6 py-8 space-y-6">

      <motion.div variants={item}>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" /> Quiz Builder
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">Create subjects, upload PDFs, and build custom quizzes.</p>
      </motion.div>

      {/* Create subject */}
      <Card title="Create Subject" desc="Add a new subject to upload materials for." icon={BookOpen} iconColor="text-indigo-400">
        <form onSubmit={createSubject} className="flex gap-3">
          <input
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-600 outline-none transition-all"
            placeholder="e.g. Machine Learning 101"
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
          />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Add
          </motion.button>
        </form>
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {subjects.map(s => (
              <span key={s.id} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/20 dark:text-indigo-300 rounded-full text-xs font-medium">
                <BookOpen className="w-3 h-3" /> {s.name}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Upload PDF */}
      <Card title="Upload PDF" desc="Upload course material to enable AI Q&A and quiz generation." icon={Upload} iconColor="text-cyan-400">
        <form onSubmit={handleUpload} className="space-y-4">
          <select
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition-all"
            value={selectedSubject}
            onChange={handleSubjectChange}
          >
            <option value="">— Select a subject —</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <label className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-cyan-500/50 rounded-xl p-6 cursor-pointer transition-colors group">
            <FileText className="w-8 h-8 text-gray-600 group-hover:text-cyan-400 transition-colors" />
            <div className="text-center">
              <p className="text-sm text-gray-700 dark:text-gray-300">{file ? file.name : 'Click to select PDF'}</p>
              <p className="text-xs text-gray-600 mt-1">Only .pdf files accepted</p>
            </div>
            <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </label>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-all shadow-lg"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Upload className="w-4 h-4" /> Upload & Index PDF</>}
          </motion.button>
        </form>

        <AnimatePresence>
          {uploadMsg && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-center gap-2 mt-4 px-4 py-3 rounded-xl text-sm border ${
                uploadMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-300'
                  : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300'
              }`}
            >
              {uploadMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {uploadMsg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {documents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-500 font-medium uppercase tracking-wider">Uploaded Documents</p>
            {documents.map(d => (
              <div key={d.id} className="flex items-center justify-between bg-white dark:bg-gray-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-200 truncate max-w-[200px]">{d.filename}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(d.status)}`} />
                  <span className={`text-xs font-medium ${statusColor(d.status)}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* BUILDER SECTION */}
      <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/70 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {[
            { id: 'auto', label: 'Auto AI', icon: Sparkles },
            { id: 'selective', label: 'Selective AI', icon: ListChecks },
            { id: 'manual', label: 'Manual Entry', icon: PencilLine },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setQuizMode(t.id); setQuizResult(null); setQuizError(null); setPreviewQuestions([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
                quizMode === t.id 
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500 dark:bg-purple-600/10 dark:text-purple-400' 
                  : 'text-gray-600 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/40'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* Common settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider px-1">Subject</label>
              <select
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none"
                value={quizSubject}
                onChange={e => setQuizSubject(e.target.value)}
              >
                <option value="">— Select Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider px-1">Semester (Optional)</label>
              <select
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none"
                value={quizSemester}
                onChange={e => setQuizSemester(e.target.value)}
              >
                <option value="">— All Semesters —</option>
                {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}
              </select>
            </div>
          </div>

          {/* MODE: AUTO AI */}
          {quizMode === 'auto' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider px-1">Number of Questions</label>
                <input
                  type="number" min="1" max="50" value={quizN}
                  onChange={e => setQuizN(parseInt(e.target.value) || '')}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none"
                />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleAutoGenerate} disabled={generating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Generate & Publish Instantly'}
              </motion.button>
            </div>
          )}

          {/* MODE: SELECTIVE AI */}
          {quizMode === 'selective' && (
            <div className="space-y-4">
              {!previewQuestions?.length ? (
                <div className="space-y-4">
                   <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider px-1">AI Pool Size</label>
                    <input
                      type="number" min="5" max="50" value={quizN}
                      onChange={e => setQuizN(parseInt(e.target.value) || '')}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none"
                    />
                    <p className="text-[10px] text-gray-600 italic px-1">AI will generate this many questions for you to pick from.</p>
                  </div>
                  <motion.button onClick={handleGetPreview} disabled={generating}
                    className="w-full py-3 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-600/10 dark:border-purple-500/30 dark:text-purple-400 rounded-xl text-sm font-bold dark:hover:bg-purple-600/20"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Fetch AI Questions for Preview'}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{selectedIndices.length} Selected</p>
                    <button onClick={() => setPreviewQuestions([])} className="text-[10px] text-red-400 hover:underline">Clear all</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {previewQuestions?.map((q, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => toggleIndex(idx)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedIndices.includes(idx) 
                            ? 'bg-purple-50 border-purple-500 dark:bg-purple-600/10' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            selectedIndices.includes(idx) ? 'bg-purple-600 border-purple-600 dark:bg-purple-500 dark:border-purple-500' : 'border-gray-400 dark:border-gray-600'
                          }`}>
                            {selectedIndices.includes(idx) && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, i) => (
                                <p key={i} className={`text-[10px] px-2 py-1 rounded ${opt.startsWith(q.answer) ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400'}`}>{opt}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <motion.button 
                    onClick={() => handleSaveCustomQuiz(previewQuestions.filter((_, i) => selectedIndices.includes(i)))}
                    disabled={generating || !selectedIndices.length}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Create Quiz with ${selectedIndices.length} Questions`}
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* MODE: MANUAL ENTRY */}
          {quizMode === 'manual' && (
            <div className="space-y-6">
              {manualQuestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider px-1">Added Questions ({manualQuestions.length})</p>
                  <div className="space-y-2">
                    {manualQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                         <div className="flex items-center gap-3 truncate">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">#{idx+1}</span>
                            <span className="text-xs text-gray-900 dark:text-white truncate">{q.question}</span>
                         </div>
                         <button onClick={() => setManualQuestions(prev => prev.filter((_, i) => i !== idx))} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10 p-1.5 rounded-lg transition-colors">
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showManualForm ? (
                <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Question Text</label>
                    <textarea 
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none h-20"
                      value={newQuestion.question}
                      onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                      placeholder="Enter your question here..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <div key={label} className="space-y-1">
                         <label className="text-[10px] font-bold text-gray-500 uppercase">Option {label}</label>
                         <input 
                           className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
                           value={newQuestion.options[idx].replace(`${label}. `, '')}
                           onChange={e => {
                             const opts = [...newQuestion.options]
                             opts[idx] = `${label}. ${e.target.value}`
                             setNewQuestion({...newQuestion, options: opts})
                           }}
                           placeholder={`Option ${label}`}
                         />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Correct Answer</label>
                      <select 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
                        value={newQuestion.answer}
                        onChange={e => setNewQuestion({...newQuestion, answer: e.target.value})}
                      >
                        {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>Option {l}</option>)}
                      </select>
                    </div>
                    <div className="flex-[2] space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Explanation (Optional)</label>
                      <input 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
                        value={newQuestion.explanation}
                        onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                        placeholder="Why is this answer correct?"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={addManualQuestion} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20">Add Question to List</button>
                    <button onClick={() => setShowManualForm(false)} className="flex-1 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold dark:hover:bg-gray-600">Cancel</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowManualForm(true)}
                  className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-2 text-gray-600 hover:text-purple-400 hover:border-purple-400 transition-all group"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">Add Manual Question</span>
                </button>
              )}

              {manualQuestions.length > 0 && (
                <motion.button 
                  onClick={() => handleSaveCustomQuiz(manualQuestions)}
                  disabled={generating || showManualForm}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Publish Quiz with ${manualQuestions.length} Questions`}
                </motion.button>
              )}
            </div>
          )}

          {/* Result / Errors */}
          <AnimatePresence>
            {quizError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-50 border border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl text-xs dark:text-red-400 flex gap-2 items-center">
                <AlertCircle className="w-3.5 h-3.5" /> {quizError}
              </motion.div>
            )}

            {quizResult && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">Quiz Published Successfully!</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-900 dark:border-gray-800 rounded-xl px-4 py-2 text-xs dark:text-gray-300 font-mono truncate">
                    {window.location.origin}/quiz/{quizResult.link_id}
                  </code>
                  <button onClick={copyLink} className={`p-2 rounded-xl transition-all ${copied ? 'bg-green-600' : 'bg-indigo-600'}`}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
