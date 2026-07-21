// ============================================================
// Mythral Client - Game Screen
// Hosts the tile map, HUD, and all overlay windows.
// Receives state from server via useGame() and sends inputs.
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react'
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
import Joystick from '../ui/Joystick.jsx'
import MobileActionButtons from '../ui/MobileActionButtons.jsx'
import ActionDrawer from '../ui/ActionDrawer.jsx'
import {
  OnlinePlayersWindow, PlayerInspectWindow, LeaderboardWindow,
  SettingsWindow, MiniMap,
} from '../ui/SocialWindows.jsx'
import { getSkillsForClass } from '../../../../shared/classes.js'
import { QUESTS } from '../../../../shared/quests.js'

export default function GameScreen({ game }) {

  const {
    player, currentIsland, map, npcs, monsters, otherPlayers, buildings,
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
    settings, isMobile,
    sendMove, sendMoveTo, stopMoveTo,
    sendAttack, sendSkill, sendUseItem, sendEquipItem, sendUnequipItem,
    sendBuyItem, sendSellItem, sendAcceptQuest, sendTurnInQuest, sendTravel, sendRespawn, sendChat,
    inspectPlayer, requestLeaderboard,
    quitToMenu,
  } = game

  // ---- Active skill (used by double-tap / keyboard selection) ----
  const [activeSkillId, setActiveSkillId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // ---- Keyboard input (ref-based to avoid re-attaching listener) ----
  const gameRef = useRef(null)
  gameRef.current = {
    player, monsters, activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
    activeOnline, activeLeaderboard, activeDialog, activeShop, activeQuestDialog, activeTravel,
    inspectData, nearbyNpc, isDead, activeSkillId,
  }

  // Close the topmost open window/dialog (used by ESC and swipe-to-dismiss)
  const closeTopWindow = useCallback(() => {
    if (activeDialog) return setActiveDialog(null)
    if (activeShop) return setActiveShop(null)
    if (activeQuestDialog) return setActiveQuestDialog(null)
    if (activeTravel) return setActiveTravel(null)
    if (inspectData) return setInspectData(null)
    if (nearbyNpc) return setNearbyNpc(null)
    if (activeInventory) return setActiveInventory(false)
    if (activeQuestLog) return setActiveQuestLog(false)
    if (activeCharacter) return setActiveCharacter(false)
    if (activeMap) return setActiveMap(false)
    if (activeHelp) return setActiveHelp(false)
    if (activeOnline) return setActiveOnline(false)
    if (activeLeaderboard) return setActiveLeaderboard(false)
    if (activeSettings) return setActiveSettings(false)
    if (drawerOpen) return setDrawerOpen(false)
  }, [activeDialog, activeShop, activeQuestDialog, activeTravel, inspectData, nearbyNpc,
      activeInventory, activeQuestLog, activeCharacter, activeMap, activeHelp,
      activeOnline, activeLeaderboard, activeSettings, drawerOpen,
      setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel,
      setInspectData, setNearbyNpc, setActiveInventory, setActiveQuestLog,
      setActiveCharacter, setActiveMap, setActiveHelp, setActiveOnline,
      setActiveLeaderboard, setActiveSettings])

  const settersRef = useRef(null)
  settersRef.current = {
    sendMove, sendSkill, setActiveSkillId, setActiveInventory, setActiveQuestLog, setActiveCharacter,
    setActiveMap, setActiveHelp, setActiveOnline, setActiveLeaderboard, setActiveSettings,
    setActiveDialog, setActiveShop, setActiveQuestDialog, setActiveTravel, setNearbyNpc, setInspectData,
    requestLeaderboard, closeTopWindow,
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const key = e.key.toLowerCase()
      const g = gameRef.current, s = settersRef.current
      if (key === 'w' || key === 'arrowup') { e.preventDefault(); s.sendMove(0, -1) }
      else if (key === 's' || key === 'arrowdown') { e.preventDefault(); s.sendMove(0, 1) }
      else if (key === 'a' || key === 'arrowleft') { e.preventDefault(); s.sendMove(-1, 0) }
      else if (key === 'd' || key === 'arrowright') { e.preventDefault(); s.sendMove(1, 0) }
      else if (key === 'i') { e.preventDefault(); s.setActiveInventory(!g.activeInventory) }
      else if (key === 'q') { e.preventDefault(); s.setActiveQuestLog(!g.activeQuestLog) }
      else if (key === 'c') { e.preventDefault(); s.setActiveCharacter(!g.activeCharacter) }
      else if (key === 'm') { e.preventDefault(); s.setActiveMap(!g.activeMap) }
      else if (key === 'p') { e.preventDefault(); s.setActiveOnline(!g.activeOnline) }
      else if (key === 'l') { e.preventDefault(); s.setActiveLeaderboard(true); s.requestLeaderboard() }
      else if (key === 'o' || key === 'escape') { e.preventDefault(); s.closeTopWindow() }
      else if (key === '?' || key === '/') { e.preventDefault(); s.setActiveHelp(!g.activeHelp) }
      else if (key >= '1' && key <= '6') {
        e.preventDefault()
        const idx = parseInt(key) - 1
        if (!g.player) return
        const skills = getSkillsForClass(g.player.class, g.player.level)
        const skillId = skills[idx]?.id
        if (skillId) {
          s.setActiveSkillId(skillId)
          const candidates = (g.monsters || [])
            .filter(m => m.hp > 0 && Math.abs(m.x - g.player.x) + Math.abs(m.y - g.player.y) <= 6)
            .sort((a, b) => Math.abs(a.x - g.player.x) + Math.abs(a.y - g.player.y) - Math.abs(b.x - g.player.x) - Math.abs(b.y - g.player.y))
          s.sendSkill(skillId, candidates[0]?.id)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ---- Tile click handler (supports tap-to-move) ----
  const handleTileClick = (tileX, tileY) => {
    if (!player || isDead) return
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
      sendMoveTo(tileX, tileY)
      return
    }
    const dist = Math.abs(tileX - player.x) + Math.abs(tileY - player.y)
    if (dist === 0) return
    if (dist === 1) {
      const dx = tileX - player.x
      const dy = tileY - player.y
      sendMove(dx, dy)
    } else {
      sendMoveTo(tileX, tileY)
    }
  }

  // ---- Mobile controls state ----
  const leftHanded = isMobile && settings.leftHanded

  const nearNpc = !!(player && (npcs || []).find(n => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1))

  // Best-target helpers
  const FRONT_DIR = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
    'up-left': [-1, -1], 'up-right': [1, -1],
    'down-left': [-1, 1], 'down-right': [1, 1],
  }
  const findFrontMonster = useCallback(() => {
    if (!player) return null
    const [dx, dy] = FRONT_DIR[player.facing] || [0, 1]
    return (monsters || []).find(m => m.x === player.x + dx && m.y === player.y + dy && m.hp > 0) || null
  }, [player, monsters])
  const findNearestMonster = useCallback(() => {
    if (!player) return null
    return (monsters || [])
      .filter(m => m.hp > 0 && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 6)
      .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - Math.abs(b.x - player.x) - Math.abs(b.y - player.y))[0] || null
  }, [player, monsters])

  const handleInteractMobile = useCallback(() => {
    if (!player || isDead) return
    const npc = (npcs || [])
      .filter(n => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1)
      .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - Math.abs(b.x - player.x) - Math.abs(b.y - player.y))[0]
    if (npc) setActiveDialog({ npc })
  }, [player, isDead, npcs, setActiveDialog])

  // ---- Double-tap/tap → use active skill ----
  const handleTileDoubleClick = useCallback((tileX, tileY) => {
    if (!player || isDead || !activeSkillId) return
    const clickedMonster = (monsters || []).find(m => m.x === tileX && m.y === tileY && m.hp > 0)
    let target = clickedMonster || findFrontMonster() || findNearestMonster()
    if (target) sendSkill(activeSkillId, target.id)
  }, [player, isDead, activeSkillId, monsters, findFrontMonster, findNearestMonster, sendSkill])

  const onDrawerAction = useCallback((key) => {
    switch (key) {
      case 'char': setActiveCharacter(!activeCharacter); break
      case 'inv': setActiveInventory(!activeInventory); break
      case 'quest': setActiveQuestLog(!activeQuestLog); break
      case 'map': setActiveMap(!activeMap); break
      case 'online': setActiveOnline(!activeOnline); break
      case 'board': { setActiveLeaderboard(!activeLeaderboard); requestLeaderboard() }; break
      case 'help': setActiveHelp(!activeHelp); break
      case 'settings': setActiveSettings(!activeSettings); break
      case 'quit': { if (confirm('Return to character select? Your progress is auto-saved.')) quitToMenu() }; break
      default: break
    }
  }, [activeCharacter, activeInventory, activeQuestLog, activeMap, activeOnline,
       activeLeaderboard, activeHelp, activeSettings,
       setActiveCharacter, setActiveInventory, setActiveQuestLog, setActiveMap,
       setActiveOnline, setActiveLeaderboard, setActiveHelp, setActiveSettings, requestLeaderboard,
       quitToMenu])

  // Mobile: swipe-down on any window header to dismiss
  useEffect(() => {
    if (!isMobile) return
    let startY = 0, dragging = false, target = null
    const onDown = (e) => {
      const header = e.target.closest?.('.mythral-window-header')
      if (!header) return
      dragging = true
      startY = e.clientY
      target = header.closest('.dialog-overlay, .mythral-window') || header.parentElement
      try { e.target.setPointerCapture?.(e.pointerId) } catch {}
    }
    const onMove = (e) => {
      if (!dragging || !target) return
      const dy = e.clientY - startY
      if (dy > 0) target.style.transform = `translateY(${Math.min(dy, 200)}px)`
    }
    const onUp = (e) => {
      if (!dragging) return
      dragging = false
      const dy = e.clientY - startY
      if (target) target.style.transform = ''
      if (dy > 70) closeTopWindow()
      target = null
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [isMobile, closeTopWindow])


  if (!player || !map) {
    return (
      <div className="connecting-screen">
        <div className="connecting-text">Entering world...</div>
        <div className="connecting-spinner" />
      </div>
    )
  }

  return (
    <div className={`game-screen ${isMobile ? 'mobile' : ''} ${settings?.compactHud ? 'compact' : ''} ${game.screenEffect ? `screen-effect-${game.screenEffect.type}` : ''}`} style={{ background: currentIsland?.backgroundColor || '#000' }}>
      <TileMap
        currentIsland={currentIsland}
        map={map}
        player={player}
        monsters={monsters}
        npcs={npcs}
        otherPlayers={otherPlayers}
        buildings={buildings}
        floatingTexts={settings.showDamageNumbers ? floatingTexts : []}
        pathTarget={game.pathTarget}
        particles={game.particles}
        onTileClick={handleTileClick}
        onTileDoubleClick={handleTileDoubleClick}
        weather={currentIsland?.weather || 'clear'}
        timeOfDay={game.timeOfDay ?? 0.5}
        screenShake={game.screenEffect?.type === 'damage' ? 6 : game.screenEffect?.type === 'levelup' ? 3 : 0}
      />

      {/* Screen-space effects */}
      <div className="screen-effects">
        <div className="vignette" />
        {game.screenEffect?.type === 'damage' && (
          <div className="damage-flash" key={game.screenEffect.id} />
        )}
        {game.screenEffect?.type === 'heal' && (
          <div className="heal-pulse" key={game.screenEffect.id} />
        )}
        {game.screenEffect?.type === 'levelup' && (
          <div className="levelup-burst" key={game.screenEffect.id} />
        )}
      </div>

      <HUD
        player={player}
        currentIsland={currentIsland}
        combatLog={combatLog}
        serverStats={serverStats}
        onlineCount={onlinePlayers.length}
        targetMonster={(() => {
          if (!player) return null
          const candidates = monsters
            .filter(m => m.hp > 0 && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 6)
            .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - Math.abs(b.x - player.x) - Math.abs(b.y - player.y))
          return candidates[0] || null
        })()}
        onToggleInventory={() => setActiveInventory(!activeInventory)}
        onToggleQuestLog={() => setActiveQuestLog(!activeQuestLog)}
        onToggleCharacter={() => setActiveCharacter(!activeCharacter)}
        onToggleMap={() => setActiveMap(!activeMap)}
        onToggleHelp={() => setActiveHelp(!activeHelp)}
        onToggleOnline={() => setActiveOnline(!activeOnline)}
        onToggleLeaderboard={() => { setActiveLeaderboard(!activeLeaderboard); requestLeaderboard() }}
        onToggleSettings={() => setActiveSettings(!activeSettings)}
        onUseSkill={(skillId, tgt) => { setActiveSkillId(skillId); sendSkill(skillId, tgt?.id) }}
        activeSkillId={activeSkillId}
        onSetActiveSkill={setActiveSkillId}
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
        onClick={() => setDrawerOpen(o => !o)}
        title="Menu"
      >
        ☰
      </button>

      {/* Mobile-only controls */}
      {isMobile && !isDead && (
        <>
          <Joystick
            onMove={sendMove}
            onStop={stopMoveTo}
            leftHanded={leftHanded}
            size={settings.joystickSize}
          />
          <MobileActionButtons
            onInteract={handleInteractMobile}
            nearNpc={nearNpc}
            leftHanded={leftHanded}
          />
          <ActionDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onAction={onDrawerAction}
          />
        </>
      )}
    </div>
  )
}
