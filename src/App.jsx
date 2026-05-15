import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import Leaderboard from './pages/Leaderboard'
import MyMatches from './pages/MyMatches'
import History from './pages/History'
import AdminSchedule from './pages/admin/AdminSchedule'
import AdminRecord from './pages/admin/AdminRecord'
import AdminSettings from './pages/admin/AdminSettings'
import PlayerAvatar from './components/PlayerAvatar'
import { useState } from 'react'

export default function App() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-300 text-sm flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-lime border-t-transparent animate-spin" />
          กำลังโหลด
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  const isAdmin = user.role === 'admin'
  const isAdminPath = location.pathname.startsWith('/admin')

  // เมนูทั้งหมดสำหรับ sidebar (iPad+)
  const playerTabs = [
    { to: '/leaderboard', icon: 'trophy', label: 'อันดับ' },
    { to: '/my-matches', icon: 'target', label: 'แมตช์ของฉัน' },
    { to: '/history', icon: 'history', label: 'ประวัติ' },
  ]
  const adminTabs = [
    { to: '/admin/schedule', icon: 'versus', label: 'จัดคู่' },
    { to: '/admin/record', icon: 'edit', label: 'ผลแมตช์' },
    { to: '/admin/settings', icon: 'settings', label: 'ตั้งค่า' },
  ]

  return (
    <div className="min-h-screen md:flex md:max-w-7xl md:mx-auto">
      {/* === SIDEBAR (iPad+ เท่านั้น) === */}
      <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 md:fixed md:h-screen md:p-6 md:border-r md:border-ink-700/40">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-lime flex items-center justify-center text-ink shadow-glow-lime">
            <span className="text-2xl">🏸</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-ink-100 leading-none">
              ป๊อกแป๊ก <span className="text-lime">LEAGUE</span>
            </h1>
            <p className="text-[10px] text-ink-300 mt-1 uppercase tracking-widest">
              {isAdmin ? '⚡ admin' : 'player'}
            </p>
          </div>
        </div>

        {/* User card */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-3 p-3 rounded-2xl bg-ink-800 border border-ink-700 hover:border-ink-600 mb-6 transition text-left"
        >
          <PlayerAvatar player={user} size={40} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink-100 truncate">{user.name}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lime font-display font-bold tnum text-base">{user.rating}</span>
              <span className="text-[10px] text-ink-300 tnum">· {user.wins}-{user.losses}</span>
            </div>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          <div className="text-[10px] text-ink-400 uppercase tracking-widest px-3 mb-2">เมนูหลัก</div>
          {playerTabs.map((t) => <SideLink key={t.to} {...t} />)}

          {isAdmin && (
            <>
              <div className="text-[10px] text-ink-400 uppercase tracking-widest px-3 mb-2 mt-6 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-lime" />
                admin
              </div>
              {adminTabs.map((t) => <SideLink key={t.to} {...t} />)}
            </>
          )}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-coral hover:bg-coral/10 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
          ออกจากระบบ
        </button>
      </aside>

      {/* === MAIN CONTENT === */}
      <div className="md:ml-64 lg:ml-72 md:flex-1 px-4 pb-28 md:pb-8 md:px-8">
        {/* Mobile header (จะหายเมื่อเข้า iPad+) */}
        <header className="md:hidden pt-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime flex items-center justify-center text-ink shadow-glow-lime">
              <span className="text-xl">🏸</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-ink-100 leading-none">
                ป๊อกแป๊ก <span className="text-lime">LEAGUE</span>
              </h1>
              <p className="text-[11px] text-ink-300 mt-1 uppercase tracking-widest">
                {isAdmin ? '⚡ admin console' : 'player'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 p-1 pr-3 rounded-full bg-ink-800 border border-ink-700"
          >
            <PlayerAvatar player={user} size={32} />
          </button>
        </header>

        {/* Desktop top spacing */}
        <div className="hidden md:block pt-8" />

        <main className="fade-up max-w-3xl" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Navigate to="/leaderboard" replace />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/my-matches" element={<MyMatches />} />
            <Route path="/history" element={<History />} />
            {isAdmin && <Route path="/admin/schedule" element={<AdminSchedule />} />}
            {isAdmin && <Route path="/admin/record" element={<AdminRecord />} />}
            {isAdmin && <Route path="/admin/settings" element={<AdminSettings />} />}
            <Route path="*" element={<Navigate to="/leaderboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* === MOBILE BOTTOM TAB BAR (ซ่อนบน iPad+) === */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto">
        <div className="card-elevated px-2 py-2">
          <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-1`}>
            {!isAdminPath ? (
              <>
                <TabLink to="/leaderboard" icon="trophy" label="อันดับ" />
                <TabLink to="/my-matches" icon="target" label="ของฉัน" />
                <TabLink to="/history" icon="history" label="ประวัติ" />
                {isAdmin && <TabLink to="/admin/schedule" icon="admin" label="admin" />}
              </>
            ) : (
              <>
                <TabLink to="/admin/schedule" icon="versus" label="จัดคู่" />
                <TabLink to="/admin/record" icon="edit" label="ผลแมตช์" />
                <TabLink to="/admin/settings" icon="settings" label="ตั้งค่า" />
                <TabLink to="/leaderboard" icon="back" label="ออก" />
              </>
            )}
          </div>
        </div>
      </nav>

      {menuOpen && <UserMenu user={user} onClose={() => setMenuOpen(false)} onLogout={logout} />}
    </div>
  )
}

const ICONS = {
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  versus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><path d="M10.5 12h3"/>
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
    </svg>
  ),
}

function TabLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
          isActive
            ? 'bg-lime text-ink shadow-glow-lime'
            : 'text-ink-300 hover:text-ink-100 hover:bg-ink-700/50'
        }`
      }
    >
      <span className="w-5 h-5">{ICONS[icon]}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </NavLink>
  )
}

function SideLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
          isActive
            ? 'bg-lime text-ink shadow-glow-lime font-semibold'
            : 'text-ink-200 hover:text-ink-100 hover:bg-ink-700/40'
        }`
      }
    >
      <span className="w-5 h-5">{ICONS[icon]}</span>
      <span className="text-sm">{label}</span>
    </NavLink>
  )
}

function UserMenu({ user, onClose, onLogout }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4 bg-black/40 backdrop-blur-sm fade-up md:hidden" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card-elevated w-72 overflow-hidden">
        <div className="p-4 border-b border-ink-700">
          <div className="flex items-center gap-3">
            <PlayerAvatar player={user} size={48} ring />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink-100 truncate">{user.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="font-display font-bold text-lime tnum text-sm">{user.rating}</div>
                <div className="text-[11px] text-ink-300 tnum">· {user.wins}-{user.losses}</div>
              </div>
              {user.role === 'admin' && (
                <div className="text-[10px] inline-block px-1.5 py-0.5 rounded bg-lime-soft text-lime mt-1.5 font-medium uppercase tracking-wider">
                  admin
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => { onLogout(); onClose() }}
          className="w-full text-left px-4 py-3 hover:bg-ink-700/40 text-sm text-coral flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
