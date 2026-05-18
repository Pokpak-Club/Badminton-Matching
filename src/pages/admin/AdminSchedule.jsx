import { useState } from 'react'
import { usePlayers } from '../../hooks/usePlayers'
import { useScheduledMatches } from '../../hooks/useScheduledMatches'
import { adminApi } from '../../lib/adminApi'
import PlayerAvatar from '../../components/PlayerAvatar'

export default function AdminSchedule() {
  const { players } = usePlayers()
  const { scheduled } = useScheduledMatches()
  const [p1, setP1] = useState(null)
  const [p2, setP2] = useState(null)
  const [roundLabel, setRoundLabel] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!p1 || !p2 || p1 === p2 || saving) return
    setSaving(true)
    try {
      await adminApi.scheduleMatch(p1, p2, roundLabel.trim() || null)
      setP1(null); setP2(null); setRoundLabel('')
    } catch (e) { alert(e.message) } finally { setSaving(false) }
  }

  async function handleCancel(id) {
    if (!confirm('ยกเลิกแมตช์นี้?')) return
    try { await adminApi.cancelScheduledMatch(id) } catch (e) { alert(e.message) }
  }

  const canCreate = p1 && p2 && p1 !== p2 && !saving

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-1">Schedule</div>
        <div className="font-display text-2xl font-bold text-ink-100">จัดคู่แมตช์</div>
        <div className="text-xs text-ink-300 mt-1">เลือกผู้เล่นสองคนเพื่อจัดคู่แมตช์ใหม่</div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-5 space-y-5 md:space-y-0">
        {/* Create form */}
        <div className="card-elevated p-4 md:self-start">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <PickerColumn label="ฝั่งซ้าย" players={players.filter(p => p.id !== p2 && p.role !== 'admin')} selected={p1} onSelect={setP1} />
            <PickerColumn label="ฝั่งขวา" players={players.filter(p => p.id !== p1 && p.role !== 'admin')} selected={p2} onSelect={setP2} />
          </div>
          <input
            type="text" value={roundLabel} onChange={(e) => setRoundLabel(e.target.value)}
            placeholder='label (เลือกใส่ก็ได้) เช่น "รอบ 1", "ชิงชนะเลิศ"'
            className="input w-full px-3 py-2 text-sm mb-3"
          />
          <button onClick={handleCreate} disabled={!canCreate} className="btn-lime w-full py-3 rounded-xl">
            {saving ? 'กำลังจัด...' : '+ จัดคู่แมตช์'}
          </button>
        </div>

        {/* Pending list */}
        <div>
          <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-lime animate-pulse" />
            แมตช์ที่จัดไว้ ({scheduled.length})
          </div>
          {scheduled.length === 0 ? (
            <div className="card text-center text-sm text-ink-300 py-8">ยังไม่มีแมตช์ที่จัดไว้</div>
          ) : (
            <div className="space-y-2 stagger">
              {scheduled.map((m) => (
                <div key={m.id} className="card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {m.round_label && (
                      <div className="text-[10px] text-lime font-semibold mb-1.5 uppercase tracking-widest">{m.round_label}</div>
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                      <PlayerAvatar player={m.player1} size={24} />
                      <span className="text-sm font-medium text-ink-100 truncate">{m.player1.name}</span>
                      <span className="text-xs text-ink-400">vs</span>
                      <PlayerAvatar player={m.player2} size={24} />
                      <span className="text-sm font-medium text-ink-100 truncate">{m.player2.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(m.id)}
                    className="text-xs text-coral px-2 py-1 hover:bg-coral/10 rounded-lg transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PickerColumn({ label, players, selected, onSelect }) {
  return (
    <div className="rounded-xl border border-ink-700 overflow-hidden bg-ink-900/40">
      <div className="px-3 py-2 text-[10px] text-ink-300 border-b border-ink-700 uppercase tracking-widest">{label}</div>
      <div className="max-h-56 overflow-y-auto p-1">
        {players.map((p) => (
          <button
            key={p.id} onClick={() => onSelect(p.id)}
            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition ${
              selected === p.id ? 'bg-lime text-ink shadow-glow-lime' : 'hover:bg-ink-700/40'
            }`}
          >
            <PlayerAvatar player={p} size={24} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{p.name}</div>
              <div className={`text-[10px] tnum font-mono ${selected === p.id ? 'opacity-70' : 'text-ink-300'}`}>
                {p.rating}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
