// ============================================================
// Aetheria: Nine Isles - Root App component
// Switches between Main Menu, Character Creation, and Game
// ============================================================

import React, { useState } from 'react'
import MainMenu from './components/screens/MainMenu.jsx'
import CharacterCreation from './components/screens/CharacterCreation.jsx'
import GameScreen from './components/screens/GameScreen.jsx'
import { useGameState } from './hooks/useGameState.js'

export default function App() {
  const game = useGameState()
  const [targetMonster, setTargetMonster] = useState(null)

  if (game.screen === 'main_menu') {
    return <MainMenu onStartNew={() => game.setScreen('character_creation')} onContinue={game.continueGame} />
  }
  if (game.screen === 'character_creation') {
    return (
      <CharacterCreation
        onCreate={game.startNewGame}
        onCancel={() => game.setScreen('main_menu')}
      />
    )
  }
  return <GameScreen game={game} targetMonster={targetMonster} setTargetMonster={setTargetMonster} />
}
