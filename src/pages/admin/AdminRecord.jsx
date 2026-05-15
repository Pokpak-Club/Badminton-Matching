import { useState } from 'react'
import { usePlayers } from '../../hooks/usePlayers'
import { useScheduledMatches } from '../../hooks/useScheduledMatches'
import { adminApi } from '../../lib/adminApi'
import { determineWinner } from '../../lib/elo'
import PlayerAvatar from '../../components/PlayerAvatar'

export default function AdminRecord() {
  const { players } = usePlayers()
  const { scheduled } = useScheduledMatches()

  const [mode, setMode] = useState('scheduled')
  const [scheduledId, setScheduledId] = useState(null)
  const [p1Id, setP1Id] = useState(null)
  const [p2Id, setP2Id] = useState(null)
  const [games, setGames] = useState([['', '']])
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState(null)

  const sched = scheduled.find((m) => m.id === scheduledId)
  const p1 = mode === 'scheduled' && sched ? sched.player1 : players.find(p => p.id === p1Id)
  const p2 = mode === 'scheduled' && sched ? sched.player2 : players.find(p => p.id === p2Id)

  const parsedGames = games.map(([a, b]) => [parseInt(a, 10), parseInt(b, 10)]).filter(([a, b]) => !isNaN(a) && !isNaN(b))
  const winnerSlot = determineWinner(parsedGames)
  const canSave = p1 && p2 && winnerSlot !== null && !saving

  function updateScore(idx, slot, v) {
    setGames((prev) => { const next = prev.map(g => [...g]); next[idx][slot] = v.replace(/\D/g, '').slice(0, 2); return next })
  }

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const winnerId = winnerSlot === 1 ? p1.id : p2.id
      const result = await adminApi.recordMatch({
        player1_id: p1.id, player2_id: p2.id, winner_id: winnerId,
        game_scores: parsedGames, scheduled_match_id: mode === 'scheduled' ? scheduledId : null,
      })
      const winner = winnerSlot === 1 ? p1.name : p2.name
      const delta = winnerSlot === 1 ? result.delta1 : result.delta2
      alert(`🏆 ${winner} ชนะ! +${delta} แต้ม`)
      setScheduledId(null); setP1Id(null); setP2Id(null); setGames([['', '']])
    } catch (e) { alert(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-1">Record result</div>
        <div className="font-display text-2xl font-bold text-ink-100">บันทึกผลแมตช์</div>
      </div>

      <div className="flex bg-ink-900/60 rounded-xl p-1 border border-ink-700/50">
        <ModeButton active={mode === 'scheduled'} onClick={() => setMode('scheduled')}>
          จัดไว้ ({scheduled.length})
        </ModeButton>
        <ModeButton active={mode === 'adhoc'} onClick={() => setMode('adhoc')}>
          ไม่ได้จัด
        </ModeButton>
      </div>

      {mode === 'scheduled' ? (
        scheduled.length === 0 ? (
          <div className="card text-center text-sm text-ink-300 py-8">
            ยังไม่มีแมตช์ที่จัดไว้<br />
            <span className="text-xs text-ink-400">ไปจัดที่หน้า "จัดคู่" ก่อน</span>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {scheduled.map((m) => (
              <button
                key={m.id} onClick={() => setScheduledId(m.id)}
                className={`w-full p-3 rounded-xl border-2 transition text-left ${
                  scheduledId === m.id ? 'border-lime bg-lime-soft shadow-glow-lime' : 'border-ink-700/40 bg-ink-800/60 hover:border-ink-600'
                }`}
              >
                {m.round_label && (
                  <div className="text-[10px] text-lime font-semibold mb-1.5 uppercase tracking-widest">{m.round_label}</div>
                )}
                <div className="flex items-center gap-2">
                  <PlayerAvatar player={m.player1} size={24} />
                  <span className="text-sm font-medium text-ink-100">{m.player1.name}</span>
                  <span className="text-xs text-ink-400">vs</span>
                  <PlayerAvatar player={m.player2} size={24} />
                  <span className="text-sm font-medium text-ink-100">{m.player2.name}</span>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="card-elevated p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <PlayerSlot player={p1} onClick={() => setPicker(1)} />
            <div className="font-display font-black text-2xl text-ink-400">VS</div>
            <PlayerSlot player={p2} onClick={() => setPicker(2)} />
          </div>
        </div>
      )}

      {p1 && p2 && (
        <>
          <div className="card-elevated p-4 md:p-6">
            <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-3">คะแนน</div>
            {games.map((game, idx) => (
              <div key={idx} className="mb-3 last:mb-0">
                <div className="flex justify-between mb-1.5">
                  <div className="text-[10px] text-ink-400 uppercase tracking-wider">เกม {idx + 1}</div>
                  {games.length > 1 && (
                    <button onClick={() => setGames(games.filter((_, i) => i !== idx))} className="text-[10px] text-coral hover:text-coral/80 uppercase tracking-wider">ลบ</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <ScoreInput value={game[0]} onChange={(v) => updateScore(idx, 0, v)} winner={game[0] !== '' && game[1] !== '' && +game[0] > +game[1]} />
                  <ScoreInput value={game[1]} onChange={(v) => updateScore(idx, 1, v)} winner={game[0] !== '' && game[1] !== '' && +game[1] > +game[0]} />
                </div>
              </div>
            ))}
            {games.length < 3 && (
              <button onClick={() => setGames([...games, ['', '']])} className="text-xs text-lime hover:text-lime-glow mt-2 uppercase tracking-wider font-semibold">
                + เพิ่มเกม {games.length + 1}
              </button>
            )}
          </div>

          <div className="text-center text-sm h-5">
            {winnerSlot === 1 && <span className="text-lime font-semibold">🏆 {p1.name} ชนะ</span>}
            {winnerSlot === 2 && <span className="text-lime font-semibold">🏆 {p2.name} ชนะ</span>}
            {winnerSlot === null && parsedGames.length > 0 && <span className="text-ink-400">ต้องชนะ 2 เกม (best-of-3)</span>}
          </div>

          <button onClick={handleSave} disabled={!canSave} className="btn-lime w-full py-4 rounded-xl text-base">
            {saving ? 'กำลังบันทึก...' : 'บันทึกผล →'}
          </button>
        </>
      )}

      {picker && (
        <PlayerPicker
          players={players.filter(p => p.id !== (picker === 1 ? p2Id : p1Id))}
          onPick={(p) => { picker === 1 ? setP1Id(p.id) : setP2Id(p.id); setPicker(null) }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

function ModeButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
      active ? 'bg-lime text-ink shadow-glow-lime' : 'text-ink-300 hover:text-ink-100'
    }`}>{children}</button>
  )
}

function PlayerSlot({ player, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex flex-col items-center gap-2 py-2 rounded-xl hover:bg-ink-700/30 transition">
      {player ? (
        <>
          <PlayerAvatar player={player} size={52} />
          <div className="text-center">
            <div className="font-medium text-sm text-ink-100">{player.name}</div>
            <div className="text-xs text-lime tnum font-mono mt-0.5">{player.rating}</div>
          </div>
        </>
      ) : (
        <>
          <div className="w-13 h-13 rounded-full border-2 border-dashed border-ink-500 flex items-center justify-center text-ink-400" style={{width: 52, height: 52}}>+</div>
          <div className="text-xs text-ink-400 uppercase tracking-wider">เลือกผู้เล่น</div>
        </>
      )}
    </button>
  )
}

function ScoreInput({ value, onChange, winner }) {
  return (
    <input
      type="text" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0"
      className={`w-full py-3 md:py-5 text-center font-display font-bold text-3xl md:text-5xl tnum rounded-xl border-2 outline-none transition ${
        winner ? 'border-lime bg-lime-soft text-lime glow-lime shadow-glow-lime'
               : 'border-ink-700 bg-ink-900/60 text-ink-100 focus:border-ink-500'
      }`}
    />
  )
}

function PlayerPicker({ players, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm fade-up" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="card-elevated w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl max-h-[70vh] overflow-y-auto">
        <div className="sticky top-0 bg-ink-800 px-5 py-3 border-b border-ink-700 flex items-center justify-between z-10">
          <div className="font-display font-semibold text-ink-100">เลือกผู้เล่น</div>
          <button onClick={onClose} className="text-ink-300 hover:text-coral w-8 h-8 rounded-lg hover:bg-ink-700/40">✕</button>
        </div>
        <div className="p-2">
          {players.map((p) => (
            <button key={p.id} onClick={() => onPick(p)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-700/40 transition">
              <PlayerAvatar player={p} size={36} />
              <div className="flex-1 text-left">
                <div className="font-medium text-sm text-ink-100">{p.name}</div>
                <div className="text-xs text-ink-300 tnum font-mono">{p.rating} · {p.wins}-{p.losses}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
