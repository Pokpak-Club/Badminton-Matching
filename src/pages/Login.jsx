import { useState } from 'react'
import { useAuth } from '../lib/auth'

const EMOJI_OPTIONS = ['🏸', '🔥', '⚡', '🦅', '🐉', '🦊', '🐯', '🦁', '🐺', '⭐', '💎', '👑']

export default function Login() {
  const [mode, setMode] = useState('login')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm md:max-w-md fade-up">
        {/* Logo / hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-lime shadow-glow-lime-lg mb-4 relative">
            <span className="text-4xl md:text-5xl">🏸</span>
            <div className="absolute inset-0 rounded-3xl bg-lime blur-2xl opacity-40 -z-10" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-ink-100">
            ป๊อกแป๊ก <span className="text-lime glow-lime">LEAGUE</span>
          </h1>
          <p className="text-sm text-ink-300 mt-2 uppercase tracking-[0.2em]">
            ฉันจะเป็นราชาแบดมินตันให้ได้เลย!
          </p>
        </div>

        <div className="card-elevated p-6 md:p-8">
          <div className="flex bg-ink-900/60 rounded-xl p-1 mb-5 border border-ink-700/50">
            <TabButton active={mode === 'login'} onClick={() => setMode('login')}>เข้าสู่ระบบ</TabButton>
            <TabButton active={mode === 'signup'} onClick={() => setMode('signup')}>สมัครใหม่</TabButton>
          </div>

          {mode === 'login' ? <LoginForm /> : <SignupForm />}
        </div>

        <p className="text-center text-[11px] text-ink-400 mt-6 uppercase tracking-widest">
          ⚡ Powered By · Poom
        </p>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
        active ? 'bg-lime text-ink shadow-glow-lime' : 'text-ink-300 hover:text-ink-100'
      }`}
    >
      {children}
    </button>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || pin.length < 4) return
    setSubmitting(true); setError('')
    try { await login(name.trim(), pin) }
    catch (err) { setError(err.message); setPin('') }
    finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="fade-up">
      <label className="block text-[10px] text-ink-300 mb-2 uppercase tracking-widest">ชื่อผู้ใช้</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ใส่ชื่อของคุณ"
        autoCapitalize="off"
        autoComplete="username"
        maxLength={20}
        className="input w-full px-3 py-3 mb-4"
      />

      <label className="block text-[10px] text-ink-300 mb-2 uppercase tracking-widest">PIN (4-6 หลัก)</label>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="••••"
        className="input w-full px-3 py-4 text-2xl tracking-[0.5em] text-center font-mono"
      />

      {error && <div className="text-xs text-coral mt-3 text-center">{error}</div>}

      <button
        type="submit"
        disabled={!name.trim() || pin.length < 4 || submitting}
        className="btn-lime w-full mt-5 py-3 rounded-xl"
      >
        {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ →'}
      </button>
    </form>
  )
}

function SignupForm() {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏸')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    if (pin !== pinConfirm) { setError('PIN ไม่ตรงกัน'); return }
    setSubmitting(true)
    try { await signup(name, pin, emoji) }
    catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-[10px] text-ink-300 mb-2 uppercase tracking-widest">ชื่อในระบบ</label>
      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={20}
        autoCapitalize="off" autoComplete="off"
        placeholder="เช่น น้องนก, พี่ตั้ม"
        className="input w-full px-3 py-2.5 mb-4"
      />

      <label className="block text-[10px] text-ink-300 mb-2 uppercase tracking-widest">เลือก emoji</label>
      <div className="grid grid-cols-6 gap-2 mb-4">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e} type="button" onClick={() => setEmoji(e)}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center border transition ${
              emoji === e
                ? 'border-lime bg-lime-soft shadow-glow-lime'
                : 'border-ink-700 bg-ink-900/40 hover:border-ink-500'
            }`}
          >{e}</button>
        ))}
      </div>

      <label className="block text-[10px] text-ink-300 mb-2 uppercase tracking-widest">ตั้ง PIN (4-6 หลัก)</label>
      <input
        type="password" inputMode="numeric" value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="••••"
        className="input w-full px-3 py-3 mb-3 text-center tracking-[0.5em] font-mono text-xl"
      />

      <label className="block text-[10px] text-ink-300 mb-2 uppercase tracking-widest">ยืนยัน PIN</label>
      <input
        type="password" inputMode="numeric" value={pinConfirm}
        onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="••••"
        className="input w-full px-3 py-3 mb-3 text-center tracking-[0.5em] font-mono text-xl"
      />

      {error && <div className="text-xs text-coral mb-3 text-center">{error}</div>}

      <button
        type="submit" disabled={!name || pin.length < 4 || submitting}
        className="btn-lime w-full py-3 rounded-xl"
      >
        {submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก →'}
      </button>
    </form>
  )
}
