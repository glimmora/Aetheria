// ============================================================
// Mythral Client - Root App component
// Switches between Auth, Character Select, and Game screens
// with smooth fade-slide transitions.
// ============================================================

import React, { useEffect, useState } from 'react'
import { useGame } from './hooks/useGame.js'
import AuthScreen from './components/screens/AuthScreen.jsx'
import CharSelectScreen from './components/screens/CharSelectScreen.jsx'
import GameScreen from './components/screens/GameScreen.jsx'
import { ConnectionIndicator } from './components/ui/SocialWindows.jsx'
import { loadAssets, isLoaded } from './art/registry.js'

export default function App() {
  const game = useGame()
  const [transitioning, setTransitioning] = useState(false)
  const [assetsReady, setAssetsReady] = useState(isLoaded())

  useEffect(() => {
    if (!isLoaded()) {
      loadAssets().then(() => setAssetsReady(true)).catch(e => console.error('asset load failed', e))
    }
  }, [])

  useEffect(() => {
    setTransitioning(true)
    const t = setTimeout(() => setTransitioning(false), 50)
    return () => clearTimeout(t)
  }, [game.screen])

  return (
    <>
      {game.token && <ConnectionIndicator connectionState={game.connectionState} kickReason={game.kickReason} />}
      {game.connectionState === 'connecting' && game.screen === 'connecting' ? (
        <div className="connecting-screen">
          <div className="connecting-card">
            <div className="connecting-text">Connecting to Mythral</div>
            <div className="connecting-spinner" />
          </div>
        </div>
      ) : game.screen === 'auth' || !game.token ? (
        <div key="auth" className={`screen-wrapper ${transitioning ? 'screen-enter' : 'screen-active'}`}>
          <AuthScreen authError={game.authError} onLogin={game.login} onRegister={game.register} />
        </div>
      ) : game.screen === 'char_select' ? (
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
      ) : (
        <div key="game" className={`screen-wrapper ${transitioning ? 'screen-enter' : 'screen-active'}`}>
          <GameScreen game={game} />
        </div>
      )}
    </>
  )
}
