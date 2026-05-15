import { useMemo } from 'react'
import { useAuth } from '../lib/auth'
import { useScheduledMatches } from '../hooks/useScheduledMatches'
import PlayerAvatar from '../components/PlayerAvatar'
import EmptyState from '../components/EmptyState'

export default function MyMatches() {
  const { user } = useAuth()
  const { scheduled, loading } = useScheduledMatches()

  const myMatches = useMemo(
    () => scheduled.filter((m) => m.player1_id === user.id || m.player2_id === user.id),
    [scheduled, user.id]
  )

  if (loading) return <div className="text-center py-12 text-ink-300 text-sm">กำลังโหลด...</div>

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] text-ink-300 uppercase tracking-widest mb-1">Your upcoming</div>
        <div className="flex items-baseline justify-between">
          <div className="font-display text-2xl font-bold text-ink-100">แมตช์ของฉัน</div>
          <div className="font-display text-2xl font-bold text-lime tnum">{myMatches.length}</div>
        </div>
      </div>

      {myMatches.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="ยังไม่มีแมตช์รอเล่น"
          description="รอ admin จัดคู่ให้คุณ แล้วจะปรากฏที่นี่"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3 stagger">
          {myMatches.map((m) => {
            const opponent = m.player1_id === user.id ? m.player2 : m.player1
            const ratingDiff = user.rating - opponent.rating
            return (
              <div key={m.id} className="card-elevated p-5 relative overflow-hidden">
                {/* Glow corner */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-lime rounded-full opacity-10 blur-3xl" />

                {m.round_label && (
                  <div className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-lime-soft text-lime font-semibold mb-4 uppercase tracking-widest">
                    <span className="w-1 h-1 rounded-full bg-lime animate-pulse" />
                    {m.round_label}
                  </div>
                )}

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <PlayerAvatar player={user} size={56} ring />
                    </div>
                    <div className="text-[10px] text-ink-300 uppercase tracking-wider">คุณ</div>
                    <div className="font-semibold text-sm text-ink-100 truncate">{user.name}</div>
                    <div className="font-display font-bold text-lime tnum text-base mt-1">{user.rating}</div>
                  </div>

                  <div className="font-display font-black text-3xl text-ink-400 -mt-4">VS</div>

                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <PlayerAvatar player={opponent} size={56} />
                    </div>
                    <div className="text-[10px] text-ink-300 uppercase tracking-wider">คู่แข่ง</div>
                    <div className="font-semibold text-sm text-ink-100 truncate">{opponent.name}</div>
                    <div className="font-display font-bold text-ink-100 tnum text-base mt-1">{opponent.rating}</div>
                  </div>
                </div>

                {/* Rating diff hint */}
                <div className="pt-3 border-t border-ink-700/40 text-center">
                  <div className="text-[10px] text-ink-300 uppercase tracking-wider">
                    ผลต่างเรตติ้ง:
                    <span className={`ml-1 font-mono ${ratingDiff > 0 ? 'text-lime' : ratingDiff < 0 ? 'text-coral' : ''}`}>
                      {ratingDiff > 0 ? '+' : ''}{ratingDiff}
                    </span>
                    <span className="ml-1 text-ink-400">
                      {ratingDiff > 50 ? '· คุณเป็นต่อ' : ratingDiff < -50 ? '· คู่แข่งเป็นต่อ' : '· สูสี'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
