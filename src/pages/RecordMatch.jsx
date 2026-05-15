import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { useMatches } from '../hooks/useMatches'
import PlayerAvatar from '../components/PlayerAvatar'
import EmptyState from '../components/EmptyState'
import { determineWinner } from '../lib/elo'

export default function RecordMatch() {
  const navigate = useNavigate()
  const { players } = usePlayers()
  const { recordMatch } = useMatches()

  const [p1Id, setP1Id] = useState(null)
  const [p2Id, setP2Id] = useState(null)
  const [games, setGames] = useState([['', '']])
  const [pickerOpen, setPickerOpen] = useState(null) // 1 | 2 | null
  const [saving, setSaving] = useState(false)

  const p1 = useMemo(() => players.find((p) => p.id === p1Id), [players, p1Id])
  const p2 = useMemo(() => players.find((p) => p.id === p2Id), [players, p2Id])

  // ตัดสินผู้ชนะอัตโนมัติ
  const parsedGames = games
    .map(([a, b]) => [parseInt(a, 10), parseInt(b, 10)])
    .filter(([a, b]) => !isNaN(a) && !isNaN(b))

  const winnerSlot = determineWinner(parsedGames)
  const canSave = p1 && p2 && parsedGames.length > 0 && winnerSlot !== null && !saving

  function updateScore(gameIdx, slot, value) {
    setGames((prev) => {
      const next = prev.map((g) => [...g])
      next[gameIdx][slot] = value.replace(/[^\d]/g, '').slice(0, 2)
      return next
    })
  }

  function addGame() {
    if (games.length < 3) setGames([...games, ['', '']])
  }

  function removeGame(idx) {
    if (games.length > 1) setGames(games.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const winnerId = winnerSlot === 1 ? p1.id : p2.id
      const result = await recordMatch({
        player1: p1,
        player2: p2,
        gameScores: parsedGames,
        winnerId,
      })
      // แสดงผลแล้วกลับไปหน้า leaderboard
      const winnerName = winnerSlot === 1 ? p1.name : p2.name
      const delta = winnerSlot === 1 ? result.deltaA : result.deltaB
      alert(`🏆 ${winnerName} ชนะ! ได้ +${delta} แต้ม`)
      navigate('/leaderboard')
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (players.length < 2) {
    return (
      <EmptyState
        icon="👥"
        title="ต้องการอย่างน้อย 2 ผู้เล่น"
        description="เพิ่มผู้เล่นที่หน้าอันดับก่อน"
      />
    )
  }

  return (
    <div>
      <div className="font-display text-lg font-semibold mb-4">บันทึกแมตช์ใหม่</div>

      {/* VS card */}
      <div className="bg-surface rounded-2xl border border-ink/10 p-5 mb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <PlayerSlot
            player={p1}
            onClick={() => setPickerOpen(1)}
            highlight={winnerSlot === 1}
          />
          <div className="font-display font-semibold text-ink-3 text-sm">VS</div>
          <PlayerSlot
            player={p2}
            onClick={() => setPickerOpen(2)}
            highlight={winnerSlot === 2}
          />
        </div>
      </div>

      {/* Score inputs */}
      <div className="bg-surface rounded-2xl border border-ink/10 p-5 mb-4">
        <div className="text-sm font-medium mb-3">คะแนน</div>
        {games.map((game, idx) => (
          <div key={idx} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs text-ink-3">เกม {idx + 1}</div>
              {games.length > 1 && (
                <button
                  onClick={() => removeGame(idx)}
                  className="text-xs text-ink-3 hover:text-rose-700"
                >
                  ลบ
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ScoreInput
                value={game[0]}
                onChange={(v) => updateScore(idx, 0, v)}
                winner={game[0] !== '' && game[1] !== '' && parseInt(game[0]) > parseInt(game[1])}
                disabled={!p1}
              />
              <ScoreInput
                value={game[1]}
                onChange={(v) => updateScore(idx, 1, v)}
                winner={game[0] !== '' && game[1] !== '' && parseInt(game[1]) > parseInt(game[0])}
                disabled={!p2}
              />
            </div>
          </div>
        ))}
        {games.length < 3 && (
          <button
            onClick={addGame}
            className="text-sm text-ink-2 hover:text-ink mt-2 flex items-center gap-1"
          >
            + เพิ่มเกม {games.length + 1}
          </button>
        )}
      </div>

      {/* Status + Save */}
      <div className="mb-4 text-center text-sm text-ink-3 h-5">
        {winnerSlot === 1 && p1 && <span>🏆 {p1.name} ชนะ</span>}
        {winnerSlot === 2 && p2 && <span>🏆 {p2.name} ชนะ</span>}
        {(!p1 || !p2) && <span>เลือกผู้เล่นทั้งสองคน</span>}
        {p1 && p2 && winnerSlot === null && parsedGames.length > 0 && (
          <span>ต้องชนะ 2 เกม (best-of-3)</span>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-3.5 rounded-2xl bg-ink text-bg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99] transition"
      >
        {saving ? 'กำลังบันทึก...' : 'บันทึกผล'}
      </button>

      {/* Player picker bottom sheet */}
      {pickerOpen && (
        <PlayerPicker
          players={players.filter((p) => p.id !== (pickerOpen === 1 ? p2Id : p1Id))}
          onPick={(p) => {
            if (pickerOpen === 1) setP1Id(p.id)
            else setP2Id(p.id)
            setPickerOpen(null)
          }}
          onClose={() => setPickerOpen(null)}
        />
      )}
    </div>
  )
}

function PlayerSlot({ player, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center gap-2 py-2 rounded-xl transition ${
        highlight ? 'bg-emerald-50' : 'hover:bg-ink/5'
      }`}
    >
      {player ? (
        <>
          <PlayerAvatar player={player} size={48} />
          <div className="text-center">
            <div className="font-medium text-sm">{player.name}</div>
            <div className="text-xs text-ink-3 tnum">{player.rating}</div>
          </div>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-ink/20 flex items-center justify-center text-ink-3">
            +
          </div>
          <div className="text-xs text-ink-3">เลือกผู้เล่น</div>
        </>
      )}
    </button>
  )
}

function ScoreInput({ value, onChange, winner, disabled }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="0"
      className={`w-full py-3 text-center font-display font-semibold text-2xl tnum rounded-xl border-2 transition outline-none ${
        winner
          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
          : 'border-ink/10 focus:border-ink/40 disabled:bg-ink/5 disabled:text-ink-3'
      }`}
    />
  )
}

function PlayerPicker({ players, onPick, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl max-h-[70vh] overflow-y-auto fade-up"
      >
        <div className="sticky top-0 bg-surface px-5 py-3 border-b border-ink/10 flex items-center justify-between">
          <div className="font-display font-semibold">เลือกผู้เล่น</div>
          <button onClick={onClose} className="text-ink-3 hover:text-ink text-lg">
            ✕
          </button>
        </div>
        <div className="p-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink/5"
            >
              <PlayerAvatar player={p} size={36} />
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-ink-3 tnum">
                  {p.rating} · {p.wins}-{p.losses}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
