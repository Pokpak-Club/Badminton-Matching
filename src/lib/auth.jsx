import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const TOKEN_KEY = 'smash_league_token'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // โหลด session จาก localStorage ตอนเริ่ม
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    refreshUser(token).finally(() => setLoading(false))
  }, [])

  async function refreshUser(token = localStorage.getItem(TOKEN_KEY)) {
    if (!token) return
    const { data, error } = await supabase.rpc('get_session_user', { p_token: token })
    if (error) {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
      return
    }
    setUser(data)
  }

  async function signup(name, pin, emoji) {
    const { data, error } = await supabase.rpc('signup_player', {
      p_name: name,
      p_pin: pin,
      p_emoji: emoji,
    })
    if (error) throw new Error(error.message)
    localStorage.setItem(TOKEN_KEY, data.token)
    await refreshUser(data.token)
  }

  async function login(name, pin) {
    const { data, error } = await supabase.rpc('login_player', { p_name: name, p_pin: pin })
    if (error) throw new Error(error.message)
    localStorage.setItem(TOKEN_KEY, data.token)
    await refreshUser(data.token)
  }

  async function logout() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) await supabase.rpc('logout', { p_token: token })
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  async function changePin(oldPin, newPin) {
    const token = localStorage.getItem(TOKEN_KEY)
    const { error } = await supabase.rpc('change_pin', {
      p_token: token,
      p_old_pin: oldPin,
      p_new_pin: newPin,
    })
    if (error) throw new Error(error.message)
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signup, login, logout, changePin, refreshUser, getToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
