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

  if (game.screen === 'connecting') {
    return (
      <div className="connecting-screen">
        <div className="connecting-text">Connecting to Aetheria...</div>
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
        onSelect={game.selectCharacter}
        onCreate={game.createCharacter}
        onDelete={game.deleteCharacter}
        onLogout={game.logout}
      />
    )
  }

  return <GameScreen game={game} />
}
