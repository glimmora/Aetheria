// ============================================================
// Aetheria Client - Game Screen
// Hosts the tile map, HUD, and all overlay windows.
// Receives state from server via useGame() and sends inputs.
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
import ChatBox from '../ui/ChatBox.jsx'
import { getSkillsForClass } from '../../../../shared/classes.js'
import { getItem } from '../../../../shared/items.js'
import { QUESTS } from '../../../../shared/quests.js'
import { QUEST_STATUS, getQuestProgressText } from '../../../../shared/quests.js'

export default function GameScreen({ game }) {
  const {
    player, currentIsland, map, npcs, monsters, otherPlayers,
    combatLog, floatingTexts, notification, isDead, chatMessages, nearbyNpc,
    activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
    activeDialog, activeShop, activeQuestDialog, activeTravel,
    setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp,
    setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel,
    setNearbyNpc,
    sendMove, sendAttack, sendSkill, sendUseItem, sendEquipItem, sendUnequipItem,
    sendBuyItem, sendSellItem, sendAcceptQuest, sendTurnInQuest, sendTravel, sendRespawn, sendChat,
    quitToMenu,
  } = game

  // Combine all monsters for rendering
  const allMonsters = monsters
  // Combine player + otherPlayers for entity rendering
  const otherPlayersList = otherPlayers

  // Keyboard input
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 'arrowup') { e.preventDefault(); sendMove(0, -1) }
      else if (key === 's' || key === 'arrowdown') { e.preventDefault(); sendMove(0, 1) }
      else if (key === 'a' || key === 'arrowleft') { e.preventDefault(); sendMove(-1, 0) }
      else if (key === 'd' || key === 'arrowright') { e.preventDefault(); sendMove(1, 0) }
      else if (key === 'i') { e.preventDefault(); setActiveInventory(!activeInventory) }
      else if (key === 'q') { e.preventDefault(); setActiveQuestLog(!activeQuestLog) }
      else if (key === 'c') { e.preventDefault(); setActiveCharacter(!activeCharacter) }
      else if (key === 'm') { e.preventDefault(); setActiveMap(!activeMap) }
      else if (key === '?' || key === '/') { e.preventDefault(); setActiveHelp(!activeHelp) }
      else if (key === 'escape') {
        e.preventDefault()
        setActiveDialog(null); setActiveShop(null); setActiveQuestDialog(null); setActiveTravel(null)
        if (activeInventory) setActiveInventory(false)
        if (activeQuestLog) setActiveQuestLog(false)
        if (activeCharacter) setActiveCharacter(false)
        if (activeMap) setActiveMap(false)
        if (activeHelp) setActiveHelp(false)
        setNearbyNpc(null)
      }
      else if (key >= '1' && key <= '6') {
        e.preventDefault()
        const idx = parseInt(key) - 1
        const skills = getSkillsForClass(player.class, player.level)
        const skillId = skills[idx]?.id
        if (skillId) {
          // auto-target nearest monster
          const candidates = allMonsters
            .filter(m => Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 6)
            .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - Math.abs(b.x - player.x) - Math.abs(b.y - player.y))
          sendSkill(skillId, candidates[0]?.id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [player, allMonsters, activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp, sendMove, sendSkill, setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp, setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel, setNearbyNpc])

  // ---- Tile click handler ----
  const handleTileClick = (tileX, tileY) => {
    if (!player || isDead) return
    const monster = allMonsters.find(m => m.x === tileX && m.y === tileY)
    if (monster) {
      sendAttack(monster.id)
      return
    }
    const npc = npcs.find(n => n.x === tileX && n.y === tileY)
    if (npc) {
      const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y)
      if (dist <= 1) {
        setActiveDialog({ npc })
        return
      }
    }
    const dx = Math.sign(tileX - player.x)
    const dy = Math.sign(tileY - player.y)
    if (dx !== 0 && dy === 0) sendMove(dx, 0)
    else if (dx === 0 && dy !== 0) sendMove(0, dy)
    else if (dx !== 0 && dy !== 0) {
      if (Math.abs(tileX - player.x) > Math.abs(tileY - player.y)) sendMove(dx, 0)
      else sendMove(0, dy)
    }
  }

  if (!player || !map) {
    return (
      <div className="connecting-screen">
        <div className="connecting-text">Entering world...</div>
        <div className="connecting-spinner" />
      </div>
    )
  }

  return (
    <div className="game-screen" style={{ background: currentIsland?.backgroundColor || '#000' }}>
      <TileMap
        currentIsland={currentIsland}
        map={map}
        player={player}
        monsters={allMonsters}
        npcs={npcs}
        otherPlayers={otherPlayersList}
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
        onUseSkill={(skillId, tgt) => sendSkill(skillId, tgt?.id)}
        gameTime={Date.now()}
      />

      <ChatBox messages={chatMessages} onSend={sendChat} />

      {notification && (
        <div className="notification-toast" key={notification.id}>
          {notification.msg}
        </div>
      )}

      {/* NPC interaction: if a player walks into an NPC, auto-open dialog */}
      {nearbyNpc && !activeDialog && (
        <div className="npc-prompt" onClick={() => { setActiveDialog({ npc: nearbyNpc }); setNearbyNpc(null) }}>
          <span className="npc-prompt-icon">!</span>
          <span>Talk to <b>{nearbyNpc.name}</b></span>
          <span className="text-xs text-dim">(click)</span>
        </div>
      )}

      {/* All overlay windows */}
      <DialogWindow
        activeDialog={activeDialog}
        questProgress={player.questProgress}
        onClose={() => setActiveDialog(null)}
        onOpenShop={(npc) => { setActiveShop({ npc }); setActiveDialog(null) }}
        onOpenQuest={(npc) => { setActiveQuestDialog({ npc, quest: QUESTS[npc.quest] }); setActiveDialog(null) }}
        onOpenTravel={(npc) => { setActiveTravel({ npc }); setActiveDialog(null) }}
      />
      <ShopWindow
        activeShop={activeShop}
        player={player}
        inventory={player.inventory}
        onClose={() => setActiveShop(null)}
        onBuy={(itemId, price, qty) => sendBuyItem(activeShop.npc.id, itemId, qty)}
        onSell={(itemId, qty) => sendSellItem(itemId, qty)}
      />
      <QuestDialog
        activeQuestDialog={activeQuestDialog}
        player={player}
        inventory={player.inventory}
        killCounts={player.killCounts}
        questProgress={player.questProgress}
        onClose={() => setActiveQuestDialog(null)}
        onAccept={(questId) => { sendAcceptQuest(questId); setActiveQuestDialog(null) }}
        onTurnIn={(questId) => { sendTurnInQuest(questId); setActiveQuestDialog(null) }}
      />
      <TravelWindow
        activeTravel={activeTravel}
        player={player}
        visitedIslands={player.visitedIslands}
        onTravel={(islandId) => { sendTravel(islandId); setActiveTravel(null) }}
        onClose={() => setActiveTravel(null)}
      />
      <InventoryWindow
        active={activeInventory}
        player={player}
        inventory={player.inventory}
        onClose={() => setActiveInventory(false)}
        onEquip={sendEquipItem}
        onUnequip={sendUnequipItem}
        onUse={sendUseItem}
        onSell={sendSellItem}
      />
      <QuestLogWindow
        active={activeQuestLog}
        player={player}
        inventory={player.inventory}
        killCounts={player.killCounts}
        questProgress={player.questProgress}
        currentIsland={player.currentIsland}
        onClose={() => setActiveQuestLog(false)}
      />
      <CharacterWindow
        active={activeCharacter}
        player={player}
        onClose={() => setActiveCharacter(false)}
      />
      <WorldMapWindow
        active={activeMap}
        currentIsland={player.currentIsland}
        visitedIslands={player.visitedIslands}
        player={player}
        killedBosses={player.killedBosses}
        onClose={() => setActiveMap(false)}
      />
      <HelpWindow active={activeHelp} onClose={() => setActiveHelp(false)} />

      {isDead && (
        <DeathScreen
          player={player}
          onRespawn={sendRespawn}
          onQuit={quitToMenu}
        />
      )}

      <button
        className="game-menu-btn"
        onClick={() => { if (confirm('Return to character select? Your progress is auto-saved.')) quitToMenu() }}
        title="Quit to Character Select"
      >
        ☰
      </button>
    </div>
  )
}
