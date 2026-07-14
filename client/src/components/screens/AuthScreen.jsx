// ============================================================
// Aetheria Client - Auth Screen (login / register)
// ============================================================

import React, { useState } from 'react'

export default function AuthScreen({ authError, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLocalError(null)
    if (!username.trim() || !password.trim()) {
      setLocalError('Please fill in all fields')
      return
    }
    if (mode === 'login') onLogin(username.trim(), password)
    else onRegister(username.trim(), password)
  }

  return (
    <div className="auth-bg">
      <div className="auth-stars" />
      <div className="auth-content">
        <div className="auth-logo">
          <div className="auth-logo-glow">AETHERIA</div>
          <h1 className="auth-logo-title">AETHERIA</h1>
          <div className="auth-logo-sub">Nine Isles · Multiplayer</div>
        </div>

        <div className="auth-card aetheria-panel">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setLocalError(null) }}
            >Login</button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setLocalError(null) }}
            >Register</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">USERNAME</label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={e => setUsername(e.target.value.slice(0, 20))}
              placeholder="3-20 chars: letters, numbers, _ -"
              maxLength={20}
              autoComplete="username"
            />
            <label className="auth-label">PASSWORD</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value.slice(0, 100))}
              placeholder="At least 6 characters"
              maxLength={100}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {(localError || authError) && (
              <div className="auth-error">{localError || authError}</div>
            )}
            <button type="submit" className="aetheria-btn aetheria-btn-success w-full mt-2">
              {mode === 'login' ? 'Enter Aetheria' : 'Create Account'}
            </button>
          </form>

          <div className="auth-hint">
            {mode === 'login' ? (
              <>New to Aetheria? <a onClick={() => setMode('register')}>Create an account</a></>
            ) : (
              <>Already have an account? <a onClick={() => setMode('login')}>Login</a></>
            )}
          </div>
        </div>

        <div className="auth-footer">
          Aetheria: Nine Isles · Multiplayer Edition · TibiaMe-inspired
        </div>
      </div>
    </div>
  )
}
