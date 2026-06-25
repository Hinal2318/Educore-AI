import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { API_URL as API } from '../../config'

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full bg-cyan-600 dark:bg-cyan-400 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

export default function StudentChat() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (user?.token) {
      axios
        .get(`${API}/subjects`, { headers: { Authorization: `Bearer ${user.token}` } })
        .then(({ data }) => setSubjects(data))
        .catch(console.error)
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q || !selectedSubject || loading) return

    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(
        `${API}/ask`,
        { question: q, subject_id: selectedSubject },
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      setMessages((prev) => [...prev, { role: 'ai', text: data.answer, sources: data.sources || [] }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '⚠️ ' + (err.response?.data?.detail || 'Something went wrong. Please try again.'),
          sources: [],
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  const selectedSubjectName = subjects.find((s) => String(s.id) === String(selectedSubject))?.name

  const hints = ['What are the key concepts?', 'Summarize the main topics', 'Give me an overview of this subject']

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] lg:h-screen max-w-3xl mx-auto px-4">

      {/* Page title */}
      <div className="pt-6 pb-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">AI Tutor Chat</h1>
          <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">Ask questions grounded in your course materials.</p>
        </div>

        {/* Subject selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">Subject:</label>
          <select
            id="chat-subject-select"
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              setMessages([])
            }}
          >
            <option value="">— Select a subject to start chatting —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5">

        {/* Empty — no subject */}
        {!selectedSubject && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-6xl drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              💬
            </motion.div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Your AI Tutor is ready</p>
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Select a subject above to start your session</p>
            </div>
          </motion.div>
        )}

        {/* Empty — subject selected, no messages */}
        {selectedSubject && messages.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-6xl drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              🎓
            </motion.div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">{selectedSubjectName}</p>
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Ask anything about this subject's materials</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {hints.map((h) => (
                <motion.button
                  key={h}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setInput(h)}
                  className="px-4 py-2 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:border-cyan-500 hover:bg-white dark:bg-gray-800 transition-colors"
                >
                  {h}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(6,182,212,0.25)]'
                      : msg.isError
                      ? 'bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300 rounded-bl-sm'
                      : 'bg-white dark:bg-gray-800/90 backdrop-blur border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Sources */}
                {msg.role === 'ai' && msg.sources?.length > 0 && (
                  <div className="px-1">
                    <p className="text-[10px] text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, si) => (
                        <span
                          key={si}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800/40 dark:text-cyan-300 rounded-full text-[11px]"
                        >
                          📄 {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur border border-gray-300 dark:border-gray-700 rounded-2xl rounded-bl-sm shadow-sm">
              <ThinkingDots />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="py-4 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={sendMessage} className="flex gap-3 items-end">
          <textarea
            id="student-chat-input"
            rows={1}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500 max-h-32 transition-shadow"
            placeholder={selectedSubject ? 'Ask a question… (Enter to send)' : 'Select a subject first'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedSubject || loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="student-chat-send"
            type="submit"
            disabled={!selectedSubject || !input.trim() || loading}
            className="shrink-0 w-12 h-12 flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded-xl transition-colors shadow-[0_4px_15px_rgba(6,182,212,0.2)] disabled:shadow-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </motion.button>
        </form>
      </div>
    </div>
  )
}
