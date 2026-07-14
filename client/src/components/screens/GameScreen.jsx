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
import {
  OnlinePlayersWindow, PlayerInspectWindow, LeaderboardWindow,
  SettingsWindow, MiniMap, ConnectionIndicator,
} from '../ui/SocialWindows.jsx'
import { getSkillsForClass } from '../../../../shared/classes.js'
import { QUESTS } from '../../../../shared/quests.js'

export default function GameScreen({ game }) {
  const {
    player, currentIsland, map, npcs, monsters, otherPlayers,
    combatLog, floatingTexts, notification, isDead, chatMessages, nearbyNpc,
    onlinePlayers, leaderboard, inspectData, serverStats,
    connectionState,
    activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
    activeOnline, activeLeaderboard, activeSettings,
    activeDialog, activeShop, activeQuestDialog, activeTravel,
    setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap, setActiveHelp,
    setActiveOnline, setActiveLeaderboard, setActiveSettings,
    setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel,
    setNearbyNpc, setInspectData,
    settings,
    sendMove, sendAttack, sendSkill, sendUseItem, sendEquipItem, sendUnequipItem,
    sendBuyItem, sendSellItem, sendAcceptQuest, sendTurnInQuest, sendTravel, sendRespawn, sendChat,
    inspectPlayer, requestLeaderboard,
    quitToMenu,
  } = game

  // Keyboard input
  useEffect(() => {
    const handler = (e) => {
      // Don't capture keys when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 'arrowup') { e.preventDefault(); sendMove(0, -1) }
      else if (key === 's' || key === 'arrowdown') { e.preventDefault(); sendMove(0, 1) }
      else if (key === 'a' || key === 'arrowleft') { e.preventDefault(); sendMove(-1, 0) }
      else if (key === 'd' || key === 'arrowright') { e.preventDefault(); sendMove(1, 0) }
      else if (key === 'i') { e.preventDefault(); setActiveInventory(!activeInventory) }
      else if (key === 'q') { e.preventDefault(); setActiveQuestLog(!activeQuestLog) }
      else if (key === 'c') { e.preventDefault(); setActiveCharacter(!activeCharacter) }
      else if (key === 'm') { e.preventDefault(); setActiveMap(!activeMap) }
      else if (key === 'p') { e.preventDefault(); setActiveOnline(!activeOnline) }
      else if (key === 'l') { e.preventDefault(); setActiveLeaderboard(!activeLeaderboard); requestLeaderboard() }
      else if (key === 'o' || key === 'escape') {
        e.preventDefault()
        if (activeDialog) { setActiveDialog(null); return }
        if (activeShop) { setActiveShop(null); return }
        if (activeQuestDialog) { setActiveQuestDialog(null); return }
        if (activeTravel) { setActiveTravel(null); return }
        if (inspectData) { setInspectData(null); return }
        if (nearbyNpc) { setNearbyNpc(null); return }
        if (activeInventory) { setActiveInventory(false); return }
        if (activeQuestLog) { setActiveQuestLog(false); return }
        if (activeCharacter) { setActiveCharacter(false); return }
        if (activeMap) { setActiveMap(false); return }
        if (activeHelp) { setActiveHelp(false); return }
        if (activeOnline) { setActiveOnline(false); return }
        if (activeLeaderboard) { setActiveLeaderboard(false); return }
        if (activeSettings) { setActiveSettings(false); return }
      }
      else if (key === '?' || key === '/') { e.preventDefault(); setActiveHelp(!activeHelp) }
      else if (key >= '1' && key <= '6') {
        e.preventDefault()
        const idx = parseInt(key) - 1
        const skills = getSkillsForClass(player.class, player.level)
        const skillId = skills[idx]?.id
        if (skillId) {
          const candidates = monsters
            .filter(m => Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 6)
            .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - Math.abs(b.x - player.x) - Math.abs(b.y - player.y))
          sendSkill(skillId, candidates[0]?.id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [player, monsters, activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
      activeOnline, activeLeaderboard, activeSettings, activeDialog, activeShop, activeQuestDialog,
      activeTravel, inspectData, nearbyNpc,
      sendMove, sendSkill, setActiveInventory, setActiveQuestLog, setActiveCharacter, setActiveMap,
      setActiveHelp, setActiveOnline, setActiveLeaderboard, setActiveSettings,
      setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel, setNearbyNpc, setInspectData,
      requestLeaderboard])

  // ---- Tile click handler ----
  const handleTileClick = (tileX, tileY) => {
    if (!player || isDead) return
    // Check if clicked on another player (inspect)
    const other = otherPlayers.find(p => p.x === tileX && p.y === tileY)
    if (other) {
      inspectPlayer(other.id)
      return
    }
    const monster = monsters.find(m => m.x === tileX && m.y === tileY)
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
        monsters={monsters}
        npcs={npcs}
        otherPlayers={otherPlayers}
        floatingTexts={settings.showDamageNumbers ? floatingTexts : []}
        onTileClick={handleTileClick}
      />

      <HUD
        player={player}
        currentIsland={currentIsland}
        combatLog={combatLog}
        serverStats={serverStats}
        onlineCount={onlinePlayers.length}
        onToggleInventory={() => setActiveInventory(!activeInventory)}
        onToggleQuestLog={() => setActiveQuestLog(!activeQuestLog)}
        onToggleCharacter={() => setActiveCharacter(!activeCharacter)}
        onToggleMap={() => setActiveMap(!activeMap)}
        onToggleHelp={() => setActiveHelp(!activeHelp)}
        onToggleOnline={() => setActiveOnline(!activeOnline)}
        onToggleLeaderboard={() => { setActiveLeaderboard(!activeLeaderboard); requestLeaderboard() }}
        onToggleSettings={() => setActiveSettings(!activeSettings)}
        onUseSkill={(skillId, tgt) => sendSkill(skillId, tgt?.id)}
        gameTime={Date.now()}
      />

      {settings.showChat && <ChatBox messages={chatMessages} onSend={sendChat} />}

      {settings.showMinimap && (
        <MiniMap
          map={map}
          player={player}
          monsters={monsters}
          npcs={npcs}
          otherPlayers={otherPlayers}
          currentIsland={currentIsland}
        />
      )}

      <ConnectionIndicator connectionState={connectionState} />

      {notification && (
        <div className={`notification-toast ${notification.leaving ? 'leaving' : ''}`} key={notification.id}>
          {notification.msg}
        </div>
      )}

      {nearbyNpc && !activeDialog && (
        <div className="npc-prompt" onClick={() => { setActiveDialog({ npc: nearbyNpc }); setNearbyNpc(null) }}>
          <span className="npc-prompt-icon">!</span>
          <span>Talk to <b>{nearbyNpc.name}</b></span>
          <span className="text-xs text-dim">(click or Esc to dismiss)</span>
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
      <OnlinePlayersWindow
        active={activeOnline}
        onlinePlayers={onlinePlayers}
        currentIsland={player.currentIsland}
        onClose={() => setActiveOnline(false)}
        onInspect={(pid) => { inspectPlayer(pid) }}
      />
      <PlayerInspectWindow
        inspectData={inspectData}
        onClose={() => setInspectData(null)}
      />
      <LeaderboardWindow
        active={activeLeaderboard}
        leaderboard={leaderboard}
        onClose={() => setActiveLeaderboard(false)}
      />
      <SettingsWindow
        active={activeSettings}
        settings={settings}
        onUpdate={game.updateSettings}
        onClose={() => setActiveSettings(false)}
        onLogout={game.logout}
      />

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
