// ============================================================
// Aetheria Client - Root App component
// Switches between Auth, Character Select, and Game screens
// with smooth fade-slide transitions.
// ============================================================

import React, { useEffect, useState } from 'react'
import { useGame } from './hooks/useGame.js'
import AuthScreen from './components/screens/AuthScreen.jsx'
import CharSelectScreen from './components/screens/CharSelectScreen.jsx'
import GameScreen from './components/screens/GameScreen.jsx'

export default function App() {
  const game = useGame()
  const [transitioning, setTransitioning] = useState(false)

  // Trigger transition flash when screen changes
  useEffect(() => {
    setTransitioning(true)
    const t = setTimeout(() => setTransitioning(false), 50)
    return () => clearTimeout(t)
  }, [game.screen])

  // Connecting screen
  if (game.connectionState === 'connecting' && game.screen === 'connecting') {
    return (
      <div className="connecting-screen">
        <div className="connecting-text">Connecting to Aetheria</div>
        <div className="connecting-spinner" />
        {game.kickReason && (
          <div className="connecting-kick">
            <div className="text-red font-bold mb-2">You were disconnected</div>
            <div className="text-dim">{game.kickReason}</div>
          </div>
        )}
      </div>
    )
  }

  if (game.connectionState === 'disconnected' && !game.token) {
    return (
      <div className="connecting-screen">
        <div className="connecting-text" style={{ color: 'var(--neon-rose)' }}>Disconnected</div>
        <div className="text-dim text-sm mt-2" style={{ letterSpacing: '0.1em' }}>Attempting to reconnect…</div>
        <div className="connecting-spinner" />
      </div>
    )
  }

  if (game.screen === 'auth' || !game.token) {
    return (
      <div key="auth" className={`screen-wrapper ${transitioning ? 'screen-enter' : 'screen-active'}`}>
        <AuthScreen authError={game.authError} onLogin={game.login} onRegister={game.register} />
      </div>
    )
  }

  if (game.screen === 'char_select') {
    return (
      <div key="charselect" className={`screen-wrapper ${transitioning ? 'screen-enter' : 'screen-active'}`}>
        <CharSelectScreen
          username={game.username}
          characters={game.characters}
          maxCharacters={game.maxCharacters}
          onSelect={game.selectCharacter}
          onCreate={game.createCharacter}
          onDelete={game.deleteCharacter}
          onLogout={game.logout}
        />
      </div>
    )
  }

  return (
    <div key="game" className={`screen-wrapper ${transitioning ? 'screen-enter' : 'screen-active'}`}>
      <GameScreen game={game} />
    </div>
  )
}
