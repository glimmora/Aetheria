// ============================================================
// Aetheria Client - Root App component
// Switches between Auth, Character Select, and Game screens
// ============================================================

import React from 'react'
import { useGame } from './hooks/useGame.js'
import AuthScreen from './components/screens/AuthScreen.jsx'
import CharSelectScreen from './components/screens/CharSelectScreen.jsx'
import GameScreen from './components/screens/GameScreen.jsx'

export default function App() {
  const game = useGame()

  // Show connecting screen while socket is establishing or reconnecting
  if (game.connectionState === 'connecting' && game.screen === 'connecting') {
    return (
      <div className="connecting-screen">
        <div className="connecting-text">Connecting to Aetheria...</div>
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
        <div className="connecting-text" style={{ color: '#f87171' }}>Disconnected from server</div>
        <div className="text-dim text-sm mt-2">Attempting to reconnect...</div>
        <div className="connecting-spinner" />
      </div>
    )
  }

  if (game.screen === 'auth' || !game.token) {
    return <AuthScreen authError={game.authError} onLogin={game.login} onRegister={game.register} />
  }

  if (game.screen === 'char_select') {
    return (
      <CharSelectScreen
        username={game.username}
        characters={game.characters}
        maxCharacters={game.maxCharacters}
        onSelect={game.selectCharacter}
        onCreate={game.createCharacter}
        onDelete={game.deleteCharacter}
        onLogout={game.logout}
      />
    )
  }

  return <GameScreen game={game} />
}
