import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Loader2,
  Network,
  Hash,
} from 'lucide-react'

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 26 } },
}

const fadeSlide = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
}

function RoleButton({ value, current, onClick, icon: Icon, label, desc, color }) {
  const active = current === value
  const styles = {
    student: active
      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
      : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-300',
    faculty: active
      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
      : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-300',
  }
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${styles[value]}`}
    >
      <Icon className="w-5 h-5" />
      <div className="text-center">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[10px] opacity-60 mt-0.5">{desc}</p>
      </div>
      {active && (
        <motion.span
          layoutId="role-check"
          className="absolute top-2 right-2"
        >
          <CheckCircle2 className={`w-4 h-4 ${value === 'student' ? 'text-indigo-400' : 'text-purple-400'}`} />
        </motion.span>
      )}
    </motion.button>
  )
}

function InputField({ id, label, icon: Icon, type, value, onChange, placeholder, rightSlot }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-500" />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 pr-11 text-gray-900 dark:text-white placeholder-gray-600 text-sm transition-all duration-200 outline-none"
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  )
}

function SelectField({ id, label, icon: Icon, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-500" />
        {label}
      </label>
      <select
        id={id}
        required
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm transition-all duration-200 outline-none appearance-none"
      >
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('')
  const { login, register } = useAuth()

  const branchOptions = [
    { value: 'information technology', label: 'Information Technology' },
    { value: 'computer engineering', label: 'Computer Engineering' },
    { value: 'AI/ML', label: 'AI/ML' }
  ]

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`
  }))

  const accentColor = role === 'faculty'
    ? 'from-purple-600 to-indigo-600'
    : 'from-indigo-600 to-cyan-600'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username.trim()) { setError('Username is required.'); return }
    if (password.length < 3) { setError('Password must be at least 3 characters.'); return }

    setLoading(true)
    try {
      if (isLogin) {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password, role, branch, semester)
      }
    } catch (err) {
      // Better error messages
      const msg = err.message || ''
      if (msg.includes('fetch') || msg.includes('refused') || msg.includes('network')) {
        setError('Cannot reach the server. Please check your internet connection or verify the server status.')
      } else if (msg.includes('Incorrect') || msg.includes('unauthorized')) {
        setError('Wrong username or password. Please try again.')
      } else if (msg.includes('already registered') || msg.includes('exists')) {
        setError('That username is already taken. Try a different one.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setIsLogin(!isLogin)
    setError('')
    setUsername('')
    setPassword('')
    setBranch('')
    setSemester('')
  }

  return (
    <div className="min-h-[92vh] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 bg-gradient-to-br ${accentColor} transition-all duration-700`} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-5 bg-purple-500" />
      </div>

      <motion.div
        key={isLogin ? 'login' : 'register'}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-gray-50 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl shadow-black/40">

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${accentColor} mb-4 shadow-lg transition-all duration-500`}
            >
              <GraduationCap className="w-8 h-8 text-gray-900 dark:text-white" />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={isLogin ? 'login-title' : 'reg-title'} {...fadeSlide}>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {isLogin ? 'Welcome back!' : 'Join Educore AI'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 mt-1">
                  {isLogin
                    ? 'Sign in to continue your learning journey'
                    : 'Create your account to get started'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-50 border-red-200 dark:bg-red-500/10 border dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role picker — only on register */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-500 font-medium uppercase tracking-wider mb-3">
                    I am a…
                  </p>
                  <div className="flex gap-3 relative">
                    <RoleButton
                      value="student"
                      current={role}
                      onClick={() => setRole('student')}
                      icon={BookOpen}
                      label="Student"
                      desc="Take quizzes & learn"
                    />
                    <RoleButton
                      value="faculty"
                      current={role}
                      onClick={() => setRole('faculty')}
                      icon={Sparkles}
                      label="Faculty"
                      desc="Create & manage content"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Branch and Semester — only on register */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-5"
                >
                  <SelectField
                    id="register-branch"
                    label="Branch"
                    icon={Network}
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    options={branchOptions}
                  />

                  {role === 'student' && (
                    <SelectField
                      id="register-semester"
                      label="Semester"
                      icon={Hash}
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      options={semesterOptions}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username */}
            <InputField
              id="login-username"
              label="Username"
              icon={User}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />

            {/* Password */}
            <InputField
              id="login-password"
              label="Password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              }
            />

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`group w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-gray-900 dark:text-white transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${accentColor} hover:shadow-indigo-500/25 hover:shadow-xl mt-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch mode */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-500">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                onClick={switchMode}
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors hover:underline underline-offset-2"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Feature hints below card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600"
        >
          {['AI-powered Q&A', 'Instant quizzes', 'Performance analytics'].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-indigo-500/60" />
              {f}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
