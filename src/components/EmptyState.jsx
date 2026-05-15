export default function EmptyState({ icon = '🏸', title, description, action }) {
  return (
    <div className="text-center py-20 px-4">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="font-display text-xl font-semibold mb-2 text-ink-100">{title}</h3>
      {description && <p className="text-sm text-ink-300 mb-5 max-w-xs mx-auto">{description}</p>}
      {action}
    </div>
  )
}
