import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const API = 'http://127.0.0.1:8000'

// Animated typing dots
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

export default function ChatPage() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [messages, setMessages] = useState([])   // {role:'user'|'ai', text, sources}
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (user) {
      axios.get(`${API}/subjects`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(({ data }) => setSubjects(data)).catch(console.error)
    }
  }, [user])

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q || !selectedSubject || loading) return

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API}/ask`, {
        question: q,
        subject_id: selectedSubject,
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.answer,
        sources: data.sources || [],
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠️ ' + (err.response?.data?.detail || 'Something went wrong. Please try again.'),
        sources: [],
        isError: true,
      }])
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

  const selectedSubjectName = subjects.find(s => String(s.id) === String(selectedSubject))?.name

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-3xl mx-auto px-4">

      {/* Subject selector bar */}
      <div className="py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 whitespace-nowrap">Subject:</span>
          <select
            id="chat-subject-select"
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              setMessages([])
            }}
          >
            <option value="">— Select a subject to start chatting —</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto py-6 space-y-5">

        {/* Empty state */}
        {!selectedSubject && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-6xl drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              💬
            </motion.div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Ask your AI Tutor anything</p>
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Select a subject above to start a conversation</p>
            </div>
          </motion.div>
        )}

        {selectedSubject && messages.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-6xl drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              🎓
            </motion.div>
            <div>
              <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">{selectedSubjectName}</p>
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Ask a question about this subject's uploaded material</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                'What are the key concepts?',
                'Summarize the main topics',
                'Give me an overview',
              ].map(hint => (
                <motion.button
                  key={hint}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setInput(hint)}
                  className="px-4 py-2 bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:border-indigo-500 hover:bg-white dark:bg-gray-800 transition-colors shadow-sm"
                >
                  {hint}
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
            <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>

              {/* Bubble */}
              <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-gray-900 dark:text-white rounded-br-sm shadow-[0_4px_15px_rgba(99,102,241,0.2)]'
                  : msg.isError
                    ? 'bg-red-900/30 border border-red-700/50 text-red-300 rounded-bl-sm'
                    : 'bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-700 text-gray-100 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>

              {/* Sources */}
              {msg.role === 'ai' && msg.sources?.length > 0 && (
                <div className="px-1 mt-1">
                  <p className="text-[10px] text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Sources used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, si) => (
                      <span
                        key={si}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-900/20 border border-indigo-800/50 text-indigo-300 rounded-full text-[11px]"
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

        {/* Thinking indicator */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-2xl rounded-bl-sm shadow-sm">
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
            id="chat-input"
            rows={1}
            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 max-h-32"
            placeholder={selectedSubject ? 'Ask a question… (Enter to send)' : 'Select a subject first'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedSubject || loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="send-btn"
            type="submit"
            disabled={!selectedSubject || !input.trim() || loading}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-colors shadow-[0_4px_15px_rgba(99,102,241,0.2)] disabled:shadow-none"
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
