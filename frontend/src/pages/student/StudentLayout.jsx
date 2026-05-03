import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import Footer from '../../components/Footer'
import {
  LayoutDashboard, ClipboardList, MessageSquare, BarChart3,
  UserCircle2, GraduationCap, LogOut, Menu, X, ChevronRight, History,
} from 'lucide-react'

const navItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard',  color: { active: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30', dot: 'bg-indigo-500 dark:bg-indigo-400', icon: 'text-indigo-600 dark:text-indigo-400', hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-200' } },
  { to: '/student/quiz',      icon: ClipboardList,   label: 'Quiz',       color: { active: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30', dot: 'bg-purple-500 dark:bg-purple-400', icon: 'text-purple-600 dark:text-purple-400', hover: 'hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-200' } },
  { to: '/student/chat',      icon: MessageSquare,   label: 'AI Chat',    color: { active: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',     dot: 'bg-cyan-500 dark:bg-cyan-400',   icon: 'text-cyan-600 dark:text-cyan-400',   hover: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-200'   } },
  { to: '/student/analytics', icon: BarChart3,       label: 'Analytics',  color: { active: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/30',     dot: 'bg-pink-500 dark:bg-pink-400',   icon: 'text-pink-600 dark:text-pink-400',   hover: 'hover:bg-pink-50 dark:hover:bg-pink-500/10 hover:text-pink-700 dark:hover:text-pink-200'   } },
  { to: '/student/account',   icon: UserCircle2,     label: 'Account',    color: { active: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',  dot: 'bg-amber-500 dark:bg-amber-400',  icon: 'text-amber-600 dark:text-amber-400',  hover: 'hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-200' } },
]

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'ST'

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-200 dark:border-gray-800/60 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <GraduationCap className="w-5 h-5 text-gray-900 dark:text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">Educore AI</p>
          <p className="text-[10px] text-indigo-600/60 dark:text-indigo-300/60 font-medium tracking-widest uppercase">Student</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:text-white hover:bg-white dark:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-3">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const c = item.color
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 group ${
                  isActive ? `${c.active} border-opacity-100` : `text-gray-600 dark:text-gray-500 border-transparent ${c.hover}`
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={`shrink-0 transition-colors ${isActive ? c.icon : 'text-gray-600 group-hover:text-current'}`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive
                    ? <motion.span layoutId="student-nav-dot" className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    : <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
                  }
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800/60 shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800/40 hover:bg-white dark:bg-gray-800/70 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-gray-900 dark:text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.username}</p>
            <p className="text-[10px] text-gray-600 dark:text-gray-500">Student</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => { logout(); navigate('/login') }}
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default function StudentLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'ST'
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── DESKTOP sidebar — always visible ── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-gray-50 dark:bg-gray-900/95 border-r border-gray-200 dark:border-gray-800/60">
        <SidebarContent />
      </aside>

      {/* ── MOBILE sidebar — slides in ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-64 z-30 flex flex-col bg-gray-50 dark:bg-gray-900/95 border-r border-gray-200 dark:border-gray-800/60 lg:hidden"
          >
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-5 h-14 border-b border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-900/40 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-white dark:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-300 dark:border-gray-700/40">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-gray-900 dark:text-white">
                {initials}
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{user?.username}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { logout(); navigate('/login') }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </motion.button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
