import { useMemo } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import { useMatches } from '../hooks/useMatches'
import { useAuth } from '../lib/auth'
import PlayerAvatar from '../components/PlayerAvatar'
import EmptyState from '../components/EmptyState'
import { winRate } from '../lib/format'

export default function Leaderboard() {
  const { players, loading } = usePlayers()
  const { matches } = useMatches(500)
  const { user } = useAuth()

  const recentDeltas = useMemo(() => {
    const map = new Map()
    for (const m of matches) {
      if (!map.has(m.player1_id)) map.set(m.player1_id, m.rating_change_p1)
      if (!map.has(m.player2_id)) map.set(m.player2_id, m.rating_change_p2)
    }
    return map
  }, [matches])

  const ranked = useMemo(
    () => [...players]
      .filter((p) => p.role !== 'admin')
      .sort((a, b) => b.rating - a.rating),
    [players]
  )
  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)

  if (loading) {
    return <div className="text-center py-12 text-ink-300 text-sm">กำลังโหลด...</div>
  }

  if (ranked.length === 0) {
    return <EmptyState icon="🏸" title="ยังไม่มีผู้เล่น" description="รอ admin เพิ่มผู้เล่นคนแรก" />
  }

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-1">Season ranking</div>
          <div className="font-display text-2xl font-bold text-ink-100">ตารางอันดับ</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-lime tnum leading-none">{players.length}</div>
          <div className="text-[10px] text-ink-300 uppercase tracking-wider mt-1">ผู้เล่น · {matches.length} แมตช์</div>
        </div>
      </div>

      {/* Podium for top 3 */}
      {top3.length > 0 && <Podium players={top3} deltas={recentDeltas} currentUserId={user?.id} />}

      {/* Rest of list */}
      {rest.length > 0 && (
        <div>
          <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-2 px-1">อันดับ 4 เป็นต้นไป</div>
          <div className="card overflow-hidden stagger">
            {rest.map((p, i) => (
              <RankRow
                key={p.id}
                player={p}
                rank={i + 4}
                delta={recentDeltas.get(p.id)}
                isMe={user && p.id === user.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Podium({ players, deltas, currentUserId }) {
  // ลำดับใน UI: #2, #1, #3
  const order = [players[1], players[0], players[2]].filter(Boolean)
  const heights = { 0: 'h-28 md:h-36', 1: 'h-36 md:h-48', 2: 'h-24 md:h-32' } // index in `order`
  const positions = { 0: 2, 1: 1, 2: 3 }

  return (
    <div className="fade-up">
      {/* Top 3 cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 items-end mb-3">
        {order.map((p, i) => {
          const rank = positions[i]
          const isMe = currentUserId === p.id
          const isChamp = rank === 1
          const delta = deltas.get(p.id)
          return (
            <div key={p.id} className="text-center relative">
              {/* Crown for #1 */}
              {isChamp && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
              )}
              <div className="flex justify-center mb-3 mt-2">
                <PlayerAvatar player={p} size={isChamp ? 72 : 56} ring={isChamp} />
              </div>
              <div className={`card ${isChamp ? 'border-lime/50' : ''} ${heights[i]} flex flex-col items-center justify-center px-2 md:px-4 relative overflow-hidden`}>
                {isChamp && (
                  <div className="absolute inset-0 bg-gradient-to-t from-lime-soft to-transparent pointer-events-none" />
                )}
                <div className={`font-display font-bold tnum ${isChamp ? 'text-3xl md:text-4xl text-lime glow-lime' : 'text-xl md:text-2xl text-ink-100'}`}>
                  #{rank}
                </div>
                <div className="text-xs md:text-sm font-medium text-ink-100 mt-1 truncate max-w-full px-1">
                  {p.name}
                  {isMe && <span className="text-lime ml-1">·</span>}
                </div>
                <div className={`font-display font-bold tnum mt-1 ${isChamp ? 'text-xl md:text-2xl text-lime' : 'text-base md:text-lg text-ink-100'}`}>
                  {p.rating}
                </div>
                <div className="text-[10px] text-ink-300 tnum font-mono">
                  {p.wins}-{p.losses}
                </div>
                {delta != null && (
                  <div className={`text-[10px] tnum font-mono mt-0.5 ${
                    delta > 0 ? 'text-lime' : delta < 0 ? 'text-coral' : 'text-ink-400'
                  }`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RankRow({ player, rank, delta, isMe }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-t border-ink-700/40 first:border-t-0 transition ${
      isMe ? 'bg-lime-soft' : 'hover:bg-ink-700/20'
    }`}>
      <div className="w-7 text-center font-display font-bold tnum text-ink-300 text-sm">
        {rank}
      </div>
      <PlayerAvatar player={player} size={36} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-ink-100 flex items-center gap-1.5 truncate">
          {player.name}
          {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime text-ink uppercase tracking-wider font-semibold">คุณ</span>}
          {player.role === 'admin' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-soft text-lime uppercase tracking-wider">admin</span>}
        </div>
        <div className="text-xs text-ink-300 tnum font-mono mt-0.5">
          {player.wins}W · {player.losses}L · {winRate(player.wins, player.losses)}%
        </div>
      </div>
      <div className="text-right">
        <div className="font-display font-bold tnum text-ink-100">{player.rating}</div>
        <div className="text-[10px] tnum font-mono">
          {delta == null ? <span className="text-ink-400">—</span>
            : delta > 0 ? <span className="text-lime">+{delta}</span>
            : delta < 0 ? <span className="text-coral">{delta}</span>
            : <span className="text-ink-400">±0</span>}
        </div>
      </div>
    </div>
  )
}
