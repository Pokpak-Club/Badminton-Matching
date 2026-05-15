import { useEffect, useRef, useState } from 'react'

export default function AddPlayerModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setName('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      await onSubmit(name)
      onClose()
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 fade-up"
      >
        <h2 className="font-display text-lg font-semibold mb-3">เพิ่มผู้เล่นใหม่</h2>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อผู้เล่น"
          maxLength={20}
          className="w-full px-3 py-2.5 rounded-lg border border-ink/15 focus:border-ink focus:outline-none text-base"
        />
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-ink/15 text-ink-2 font-medium hover:bg-ink/5"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 rounded-lg bg-ink text-bg font-medium disabled:opacity-40"
          >
            {saving ? 'กำลังบันทึก...' : 'เพิ่ม'}
          </button>
        </div>
      </form>
    </div>
  )
}
