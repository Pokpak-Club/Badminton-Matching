import { useState } from 'react'
import { usePlayers } from '../../hooks/usePlayers'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../lib/auth'
import { adminApi } from '../../lib/adminApi'
import PlayerAvatar from '../../components/PlayerAvatar'

export default function AdminSettings() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-1">System config</div>
        <div className="font-display text-2xl font-bold text-ink-100">ตั้งค่าระบบ</div>
        <div className="text-xs text-ink-300 mt-1">จัดการระบบคะแนนและผู้เล่น</div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-5 space-y-5 md:space-y-0">
        <SettingsCard />
        <PlayerManagement />
      </div>
    </div>
  )
}

function SettingsCard() {
  const { settings } = useSettings()
  const [kFactor, setKFactor] = useState('')
  const [startRating, setStartRating] = useState('')
  const [saving, setSaving] = useState(false)

  const currentK = kFactor === '' ? settings?.k_factor : kFactor
  const currentStart = startRating === '' ? settings?.starting_rating : startRating

  async function handleSave() {
    setSaving(true)
    try {
      await adminApi.updateSettings(parseInt(currentK), parseInt(currentStart))
      setKFactor(''); setStartRating(''); alert('บันทึกแล้ว')
    } catch (e) { alert(e.message) } finally { setSaving(false) }
  }

  if (!settings) return null

  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-lime-soft flex items-center justify-center text-lime">
          ⚡
        </div>
        <div>
          <div className="font-semibold text-ink-100">ระบบ ELO</div>
          <div className="text-[10px] text-ink-300 uppercase tracking-wider">rating system</div>
        </div>
      </div>

      <label className="block text-[10px] text-ink-300 mb-1.5 uppercase tracking-widest">K-factor</label>
      <input
        type="number" min={1} max={100} value={currentK ?? ''}
        onChange={(e) => setKFactor(e.target.value)}
        className="input w-full px-3 py-2 mb-1 font-mono text-lg"
      />
      <div className="text-[10px] text-ink-400 mb-4">
        ความผันผวนของเรตติ้ง (1-100) · ค่ามาตรฐาน 32
      </div>

      <label className="block text-[10px] text-ink-300 mb-1.5 uppercase tracking-widest">Starting rating</label>
      <input
        type="number" value={currentStart ?? ''} onChange={(e) => setStartRating(e.target.value)}
        className="input w-full px-3 py-2 mb-4 font-mono text-lg"
      />

      <button
        onClick={handleSave} disabled={saving || (kFactor === '' && startRating === '')}
        className="btn-lime w-full py-2.5 rounded-xl"
      >
        {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
      </button>
    </div>
  )
}

function PlayerManagement() {
  const { players } = usePlayers({ all: true })
  const { user } = useAuth()
  const [overrideOpen, setOverrideOpen] = useState(null)

  async function handleToggleRole(p) {
    const next = p.role === 'player' ? 'admin' : p.role === 'admin' ? 'manager' : 'player'
    const label = { player: 'ผู้เล่น', admin: 'admin', manager: 'manager (ไม่มีแต้ม)' }
    if (!confirm(`เปลี่ยน "${p.name}" เป็น ${label[next]}?`)) return
    try { await adminApi.setRole(p.id, next) } catch (e) { alert(e.message) }
  }

  async function handleDelete(p) {
    if (p.id === user.id) { alert('ลบตัวเองไม่ได้'); return }
    if (!confirm(`ลบ "${p.name}" และข้อมูลทั้งหมด?`)) return
    try { await adminApi.deletePlayer(p.id) } catch (e) { alert(e.message) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-700/40 bg-ink-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky/20 flex items-center justify-center text-sky">👥</div>
          <div>
            <div className="font-semibold text-ink-100">จัดการผู้เล่น</div>
            <div className="text-[10px] text-ink-300 uppercase tracking-wider">{players.length} ผู้เล่นในระบบ</div>
          </div>
        </div>
      </div>

      {players.map((p) => (
        <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-ink-700/30 last:border-b-0 hover:bg-ink-700/20 transition">
          <PlayerAvatar player={p} size={36} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-ink-100 flex items-center gap-1.5">
              {p.name}
              {p.role === 'admin' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-soft text-lime uppercase tracking-widest">admin</span>}
              {p.role === 'manager' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky/20 text-sky uppercase tracking-widest">manager</span>}
            </div>
            <div className="text-xs text-ink-300 tnum font-mono mt-0.5">
              {p.role === 'manager' ? 'ไม่มีแต้ม' : `${p.rating} · ${p.wins}-${p.losses}`}
            </div>
          </div>
          <div className="flex gap-1">
            <IconButton onClick={() => setOverrideOpen(p)} title="ปรับเรตติ้ง" color="text-gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </IconButton>
            <IconButton onClick={() => handleToggleRole(p)} title="เปลี่ยน role" color="text-sky">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              </svg>
            </IconButton>
            <IconButton onClick={() => handleDelete(p)} title="ลบ" color="text-coral" hoverBg="hover:bg-coral/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </IconButton>
          </div>
        </div>
      ))}

      {overrideOpen && <OverrideRatingModal player={overrideOpen} onClose={() => setOverrideOpen(null)} />}
    </div>
  )
}

function IconButton({ onClick, title, children, color = 'text-ink-300', hoverBg = 'hover:bg-ink-700/40' }) {
  return (
    <button onClick={onClick} title={title} className={`p-2 rounded-lg transition ${color} ${hoverBg}`}>
      {children}
    </button>
  )
}

function OverrideRatingModal({ player, onClose }) {
  const [newRating, setNewRating] = useState(player.rating)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!reason.trim()) { alert('กรุณาใส่เหตุผล'); return }
    setSaving(true)
    try { await adminApi.overrideRating(player.id, parseInt(newRating), reason.trim()); onClose() }
    catch (e) { alert(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm fade-up" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card-elevated w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <PlayerAvatar player={player} size={40} />
          <div>
            <div className="font-display text-base font-semibold text-ink-100">ปรับเรตติ้ง</div>
            <div className="text-xs text-ink-300">ปัจจุบัน: <span className="text-lime font-mono">{player.rating}</span></div>
          </div>
        </div>

        <label className="block text-[10px] text-ink-300 mb-1.5 uppercase tracking-widest">เรตติ้งใหม่</label>
        <input
          type="number" value={newRating} onChange={(e) => setNewRating(e.target.value)}
          className="input w-full px-3 py-3 mb-3 font-mono text-2xl text-center"
        />

        <label className="block text-[10px] text-ink-300 mb-1.5 uppercase tracking-widest">เหตุผล</label>
        <input
          type="text" value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder='เช่น "ปรับยอดเริ่มต้น"'
          className="input w-full px-3 py-2 mb-4"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1 py-2.5 rounded-xl font-medium">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving} className="btn-lime flex-1 py-2.5 rounded-xl">
            {saving ? 'กำลังบันทึก...' : 'ปรับ'}
          </button>
        </div>
      </div>
    </div>
  )
}
