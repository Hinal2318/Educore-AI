import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  User, Lock, Bell, Palette, LogOut, Trash2, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2, ShieldCheck, Settings2,
  Moon, Sun, Monitor, UserCircle2, GraduationCap,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

function Section({ title, desc, icon: Icon, iconColor = 'text-indigo-400', children }) {
  return (
    <motion.div variants={item} className="bg-gray-50 dark:bg-gray-900/60 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white dark:bg-gray-800/60 ${iconColor}`}><Icon className="w-4 h-4" /></div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          {desc && <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-200 dark:border-gray-800/60 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange}
      className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${checked ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <motion.div
        initial={false}
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  )
}

function PwInput({ id, label, icon: Icon, value, onChange, show, onToggleShow, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-500" />{label}
      </label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-600 outline-none transition-all"
        />
        <button type="button" onClick={onToggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors" tabIndex={-1}>
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function FacultyAccount() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('faculty_notifications')
    return saved ? JSON.parse(saved) : { studentAttempt: true, weeklyReport: true, systemUpdates: false }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  // Persist settings
  React.useEffect(() => {
    localStorage.setItem('faculty_notifications', JSON.stringify(notifications))
  }, [notifications])

  React.useEffect(() => {
    localStorage.setItem('theme', theme)
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'FA'

  function handleChangePw(e) {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    setSavingPw(true)
    setTimeout(() => {
      setSavingPw(false); setPwSuccess('Password updated successfully!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    }, 1200)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto px-6 py-8 space-y-6">

      <motion.div variants={item}>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-purple-400" /> Account Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">Manage your faculty profile, security and preferences.</p>
      </motion.div>

      {/* Profile hero */}
      <motion.div variants={item}
        className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 rounded-2xl p-6 flex items-center gap-5"
      >
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl font-extrabold text-gray-900 dark:text-white shadow-lg shadow-purple-500/20">
            {initials}
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-gray-900 dark:text-white">{user?.username}</p>
          <p className="text-sm text-purple-600/70 dark:text-purple-300/70 mt-0.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" /> Faculty · Educore AI
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 dark:bg-green-400/10 dark:border-green-400/20 dark:text-green-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs text-purple-700 dark:bg-purple-400/10 dark:border-purple-400/20 dark:text-purple-400 font-medium">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          </div>
        </div>
      </motion.div>

      {/* Account info */}
      <Section title="Account Information" desc="Your registered faculty account details." icon={User} iconColor="text-indigo-400">
        <InfoRow label="Username" value={user?.username ?? '—'} />
        <InfoRow label="Role" value={
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-300"><GraduationCap className="w-3.5 h-3.5" /> Faculty</span>
        } />
        <InfoRow label="Member Since" value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} />
        <InfoRow label="Status" value={
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400"><span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />Active</span>
        } />
      </Section>

      {/* Change password */}
      <Section title="Change Password" desc="Use a strong password of at least 8 characters." icon={Lock} iconColor="text-purple-400">
        <form onSubmit={handleChangePw} className="space-y-4">
          <PwInput id="f-cur-pw" label="Current Password" icon={Lock} value={currentPw} onChange={e => setCurrentPw(e.target.value)} show={showCurrent} onToggleShow={() => setShowCurrent(!showCurrent)} placeholder="••••••••" />
          <PwInput id="f-new-pw" label="New Password" icon={Lock} value={newPw} onChange={e => setNewPw(e.target.value)} show={showNew} onToggleShow={() => setShowNew(!showNew)} placeholder="Min. 8 characters" />
          <PwInput id="f-confirm-pw" label="Confirm Password" icon={ShieldCheck} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} show={showConfirm} onToggleShow={() => setShowConfirm(!showConfirm)} placeholder="Re-enter new password" />

          {newPw && (
            <div className="flex gap-1 items-center">
              {[1,2,3,4].map(i => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                  i===1&&newPw.length>=1?'bg-red-500': i===2&&newPw.length>=6?'bg-yellow-500': i===3&&newPw.length>=10?'bg-green-400': i===4&&newPw.length>=14?'bg-green-500':'bg-white dark:bg-gray-800'
                }`} />
              ))}
              <span className="text-[10px] text-gray-600 dark:text-gray-500 ml-2 whitespace-nowrap">
                {newPw.length < 6 ? 'Weak' : newPw.length < 10 ? 'Fair' : newPw.length < 14 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}

          <AnimatePresence>
            {pwError && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 px-4 py-3 rounded-xl dark:text-red-300">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" /> {pwError}
              </motion.div>
            )}
            {pwSuccess && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20 px-4 py-3 rounded-xl dark:text-green-300">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> {pwSuccess}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={savingPw}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
          >
            {savingPw ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : <><ShieldCheck className="w-4 h-4" /> Update Password</>}
          </motion.button>
        </form>
      </Section>

      {/* Notifications */}
      <Section title="Notification Preferences" desc="Choose what you'd like to be notified about." icon={Bell} iconColor="text-cyan-400">
        <div className="space-y-5">
          {[
            { key: 'studentAttempt', label: 'Student quiz attempt', desc: 'When a student completes a quiz' },
            { key: 'weeklyReport', label: 'Weekly analytics report', desc: 'A summary of class performance' },
            { key: 'systemUpdates', label: 'System updates', desc: 'Platform updates and new features' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{desc}</p>
              </div>
              <Toggle checked={notifications[key]} onChange={() => setNotifications(p => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" desc="Customize how the portal looks." icon={Palette} iconColor="text-pink-400">
        <div className="flex gap-3">
          {[{ val:'dark', icon:Moon, label:'Dark' }, { val:'light', icon:Sun, label:'Light' }, { val:'system', icon:Monitor, label:'System' }].map(({ val, icon: Icon, label }) => (
            <motion.button key={val} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setTheme(val)}
              className={`flex-1 flex flex-col items-center gap-2.5 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                theme === val
                  ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-300'
                  : 'bg-white dark:bg-gray-800/40 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:border-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />{label}
              {theme === val && <motion.div layoutId="faculty-theme-dot" className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <motion.div variants={item} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-500">These actions cannot be undone.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { logout(); navigate('/login') }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 dark:bg-red-600/10 dark:hover:bg-red-600/20 dark:border-red-500/30 dark:text-red-400 text-sm font-medium rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
