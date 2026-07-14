// ============================================================
// Aetheria: Nine Isles - Game Screen
// The main in-game view that hosts all UI
// ============================================================

import React, { useEffect, useRef } from 'react'
import TileMap from '../TileMap.jsx'
import HUD from '../ui/HUD.jsx'
import DialogWindow from '../ui/DialogWindow.jsx'
import ShopWindow from '../ui/ShopWindow.jsx'
import QuestDialog from '../ui/QuestDialog.jsx'
import TravelWindow from '../ui/TravelWindow.jsx'
import InventoryWindow from '../ui/InventoryWindow.jsx'
import QuestLogWindow from '../ui/QuestLogWindow.jsx'
import { CharacterWindow, WorldMapWindow, HelpWindow } from '../ui/MiscWindows.jsx'
import DeathScreen from '../ui/DeathScreen.jsx'
import { ISLAND_DEFS } from '../../data/islands.js'
import { getSkillsForClass } from '../../data/classes.js'

export default function GameScreen({ game, targetMonster, setTargetMonster }) {
  const {
    screen, player, setScreen, inventory, currentIsland, monsters, npcs,
    questProgress, killCounts, visitedIslands, killedBosses, combatLog, floatingTexts,
    activeDialog, activeShop, activeQuestDialog, activeTravel,
    activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
    notification, isDead, gameTime,
    movePlayer, performAttack, performSkill, handleTileClick,
    closeDialog, openShop, openQuestDialog, openTravel,
    handleAcceptQuest, handleTurnInQuest,
    handleBuyItem, handleSellItem,
    handleEquipItem, handleUnequipItem, handleUseConsumable,
    travelTo, respawn, quitToMenu, save,
    setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp,
  } = game

  const targetMonsterRef = useRef(null)
  targetMonsterRef.current = targetMonster

  // Keyboard input
  useEffect(() => {
    if (screen !== 'game') return
    const handler = (e) => {
      const key = e.key.toLowerCase()
      // movement
      if (key === 'w' || key === 'arrowup') { e.preventDefault(); movePlayer(0, -1) }
      else if (key === 's' || key === 'arrowdown') { e.preventDefault(); movePlayer(0, 1) }
      else if (key === 'a' || key === 'arrowleft') { e.preventDefault(); movePlayer(-1, 0) }
      else if (key === 'd' || key === 'arrowright') { e.preventDefault(); movePlayer(1, 0) }
      // windows
      else if (key === 'i') { e.preventDefault(); setActiveInventory(!activeInventory) }
      else if (key === 'q') { e.preventDefault(); setActiveQuestLog(!activeQuestLog) }
      else if (key === 'c') { e.preventDefault(); setActiveCharacter(!activeCharacter) }
      else if (key === 'm') { e.preventDefault(); setActiveMap(!activeMap) }
      else if (key === '?' || key === '/') { e.preventDefault(); setActiveHelp(!activeHelp) }
      else if (key === 'escape') {
        e.preventDefault()
        closeDialog()
        if (activeInventory) setActiveInventory(false)
        if (activeQuestLog) setActiveQuestLog(false)
        if (activeCharacter) setActiveCharacter(false)
        if (activeMap) setActiveMap(false)
        if (activeHelp) setActiveHelp(false)
      }
      // skills 1-6
      else if (key >= '1' && key <= '6') {
        e.preventDefault()
        const idx = parseInt(key) - 1
        // find nearest monster in range as target
        const skills = player.classDef?.startingSkills || []
        // We get the skills list dynamically in HUD; for skill casting, just find nearest aggro monster
        const candidates = monsters
          .filter(m => Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 6)
          .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - Math.abs(b.x - player.x) - Math.abs(b.y - player.y))
        const tgt = candidates[0] || null
        // Use skill index
        const skillKeys = getSkillKeysForClassHelper(player.class, player.level)
        const skillId = skillKeys[idx]
        if (skillId) performSkill(skillId, tgt)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, player, monsters, activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp, movePlayer, performSkill, setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp, closeDialog])

  // Save on page hide
  useEffect(() => {
    const handler = () => save()
    window.addEventListener('beforeunload', handler)
    document.addEventListener('visibilitychange', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      document.removeEventListener('visibilitychange', handler)
    }
  }, [save])

  if (!player) return null
  const islandDef = ISLAND_DEFS[currentIsland]

  return (
    <div className="game-screen" style={{ background: islandDef?.backgroundColor || '#000' }}>
      <TileMap
        currentIsland={currentIsland}
        player={player}
        monsters={monsters}
        npcs={npcs}
        floatingTexts={floatingTexts}
        onTileClick={handleTileClick}
      />

      <HUD
        player={player}
        currentIsland={currentIsland}
        combatLog={combatLog}
        onToggleInventory={() => setActiveInventory(!activeInventory)}
        onToggleQuestLog={() => setActiveQuestLog(!activeQuestLog)}
        onToggleCharacter={() => setActiveCharacter(!activeCharacter)}
        onToggleMap={() => setActiveMap(!activeMap)}
        onToggleHelp={() => setActiveHelp(!activeHelp)}
        onUseSkill={(skillId, tgt) => {
          const target = tgt || monsters
            .filter(m => Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 6)
            .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - Math.abs(b.x - player.x) - Math.abs(b.y - player.y))[0]
          performSkill(skillId, target)
        }}
        targetMonster={targetMonster}
        gameTime={gameTime}
      />

      {/* Notification toast */}
      {notification && (
        <div className="notification-toast" key={notification.id}>
          {notification.msg}
        </div>
      )}

      {/* All overlay windows */}
      <DialogWindow
        activeDialog={activeDialog}
        questProgress={questProgress}
        onClose={closeDialog}
        onOpenShop={openShop}
        onOpenQuest={openQuestDialog}
        onOpenTravel={openTravel}
      />
      <ShopWindow
        activeShop={activeShop}
        player={player}
        inventory={inventory}
        onClose={closeDialog}
        onBuy={handleBuyItem}
        onSell={handleSellItem}
      />
      <QuestDialog
        activeQuestDialog={activeQuestDialog}
        player={player}
        inventory={inventory}
        killCounts={killCounts}
        questProgress={questProgress}
        onClose={closeDialog}
        onAccept={handleAcceptQuest}
        onTurnIn={handleTurnInQuest}
      />
      <TravelWindow
        activeTravel={activeTravel}
        player={player}
        visitedIslands={visitedIslands}
        onTravel={travelTo}
        onClose={closeDialog}
      />
      <InventoryWindow
        active={activeInventory}
        player={player}
        inventory={inventory}
        onClose={() => setActiveInventory(false)}
        onEquip={handleEquipItem}
        onUnequip={handleUnequipItem}
        onUse={handleUseConsumable}
        onSell={handleSellItem}
      />
      <QuestLogWindow
        active={activeQuestLog}
        player={player}
        inventory={inventory}
        killCounts={killCounts}
        questProgress={questProgress}
        currentIsland={currentIsland}
        onClose={() => setActiveQuestLog(false)}
      />
      <CharacterWindow
        active={activeCharacter}
        player={player}
        onClose={() => setActiveCharacter(false)}
      />
      <WorldMapWindow
        active={activeMap}
        currentIsland={currentIsland}
        visitedIslands={visitedIslands}
        player={player}
        killedBosses={killedBosses}
        onClose={() => setActiveMap(false)}
      />
      <HelpWindow
        active={activeHelp}
        onClose={() => setActiveHelp(false)}
      />

      {isDead && (
        <DeathScreen
          player={player}
          onRespawn={respawn}
          onQuit={quitToMenu}
        />
      )}

      {/* Menu button (top-right corner) */}
      <button
        className="game-menu-btn"
        onClick={() => {
          if (confirm('Save and return to main menu?')) {
            save()
            quitToMenu()
          }
        }}
        title="Save & Quit"
      >
        ☰
      </button>
    </div>
  )
}

// Helper to get skill keys
function getSkillKeysForClassHelper(classId, level) {
  const skills = getSkillsForClass(classId, level)
  return skills.slice(0, 6).map(s => s.id)
}
