import { useMemo } from 'react'
import { useMatches } from '../hooks/useMatches'
import PlayerAvatar from '../components/PlayerAvatar'
import EmptyState from '../components/EmptyState'
import { dayLabel, timeOfDay } from '../lib/format'

export default function History() {
  const { matches, loading } = useMatches(200)

  const grouped = useMemo(() => {
    const groups = []
    let currentLabel = null
    let currentGroup = null
    for (const m of matches) {
      const label = dayLabel(m.played_at)
      if (label !== currentLabel) {
        currentLabel = label
        currentGroup = { label, items: [] }
        groups.push(currentGroup)
      }
      currentGroup.items.push(m)
    }
    return groups
  }, [matches])

  if (loading) return <div className="text-center py-12 text-ink-300 text-sm">กำลังโหลด...</div>
  if (matches.length === 0) {
    return <EmptyState icon="📜" title="ยังไม่มีแมตช์" description="รอ admin บันทึกแมตช์แรก" />
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-1">Match log</div>
        <div className="flex items-baseline justify-between">
          <div className="font-display text-2xl font-bold text-ink-100">ประวัติแมตช์</div>
          <div className="font-display text-2xl font-bold text-lime tnum">{matches.length}</div>
        </div>
      </div>

      <div className="space-y-5 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
        {grouped.map((group) => (
          <div key={group.label}>
            <div className="text-[11px] font-semibold text-ink-300 mb-2 px-1 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-lime" />
              {group.label}
            </div>
            <div className="card overflow-hidden">
              {group.items.map((m) => <MatchRow key={m.id} match={m} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchRow({ match }) {
  const p1Won = match.winner_id === match.player1_id
  const winner = p1Won ? match.player1 : match.player2
  const loser = p1Won ? match.player2 : match.player1
  const winnerDelta = p1Won ? match.rating_change_p1 : match.rating_change_p2

  return (
    <div className="px-4 py-3 border-t border-ink-700/40 first:border-t-0 hover:bg-ink-700/20 transition">
      {/* Top row: players */}
      <div className="flex items-center gap-2 mb-2">
        <PlayerAvatar player={winner} size={28} />
        <span className="text-sm font-semibold text-ink-100 truncate">{winner?.name || '?'}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime text-ink font-semibold uppercase tracking-wider">won</span>
        <span className="text-xs text-ink-400">vs</span>
        <PlayerAvatar player={loser} size={20} />
        <span className="text-sm text-ink-300 truncate flex-1">{loser?.name || '?'}</span>
        <span className="text-[10px] text-ink-400 tnum font-mono shrink-0">{timeOfDay(match.played_at)}</span>
      </div>

      {/* Bottom row: scores + rating */}
      <div className="flex items-center justify-between pl-9">
        <div className="text-xs text-ink-300 tnum font-mono">
          {match.game_scores.map(([a, b], i) => (
            <span key={i}>
              {i > 0 && <span className="text-ink-500 mx-1">·</span>}
              {/* Bold the winner's side */}
              {p1Won ? (
                <><span className="text-ink-100 font-semibold">{a}</span>-{b}</>
              ) : (
                <>{a}-<span className="text-ink-100 font-semibold">{b}</span></>
              )}
            </span>
          ))}
        </div>
        <div className="text-[11px] tnum font-mono px-2 py-0.5 rounded bg-lime-soft text-lime font-semibold">
          +{winnerDelta}
        </div>
      </div>
    </div>
  )
}
