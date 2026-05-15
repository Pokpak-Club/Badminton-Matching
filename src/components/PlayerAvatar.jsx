// Vibrant gradient palettes for dark theme
const PALETTE = [
  { from: '#c4f04b', to: '#8fb52e', text: '#0a0e1a' },   // lime
  { from: '#5eaaff', to: '#3678e8', text: '#fff' },       // sky
  { from: '#ff6b5b', to: '#d94838', text: '#fff' },       // coral
  { from: '#fbbf24', to: '#d97706', text: '#1a1a1a' },    // gold
  { from: '#a78bfa', to: '#7c3aed', text: '#fff' },       // violet
  { from: '#34d399', to: '#059669', text: '#fff' },       // emerald
  { from: '#f472b6', to: '#db2777', text: '#fff' },       // pink
  { from: '#06b6d4', to: '#0891b2', text: '#fff' },       // cyan
]

function colorForName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function PlayerAvatar({ player, size = 36, ring = false }) {
  const c = colorForName(player?.name)
  const showEmoji = player?.emoji && size >= 32
  const initial = (player?.name || '?').slice(0, 1)
  return (
    <div
      className="rounded-full flex items-center justify-center font-display font-semibold shrink-0 relative"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
        color: c.text,
        fontSize: size * 0.4,
        boxShadow: ring
          ? `0 0 0 2px #0a0e1a, 0 0 0 4px ${c.from}, 0 8px 20px -8px ${c.from}80`
          : `0 4px 12px -4px ${c.from}40`,
      }}
      aria-hidden="true"
    >
      {showEmoji ? (
        <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{player.emoji}</span>
      ) : (
        initial
      )}
    </div>
  )
}
