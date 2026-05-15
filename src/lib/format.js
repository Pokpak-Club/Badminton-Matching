export function timeAgo(iso) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'เมื่อกี้นี้'
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export function dayLabel(iso) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(date, today)) return 'วันนี้'
  if (isSameDay(date, yesterday)) return 'เมื่อวาน'
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function timeOfDay(iso) {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

export function winRate(wins, losses) {
  const total = wins + losses
  if (total === 0) return 0
  return Math.round((wins / total) * 100)
}
