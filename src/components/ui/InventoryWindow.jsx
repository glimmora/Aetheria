// ============================================================
// Aetheria: Nine Isles - Inventory Window
// ============================================================

import React, { useState } from 'react'
import { getItem, isEquipment } from '../../data/items.js'
import { computePlayerStats } from '../../systems/combat.js'

export default function InventoryWindow({
  player, inventory, active, onClose,
  onEquip, onUnequip, onUse, onSell,
}) {
  const [selected, setSelected] = useState(null)
  if (!active || !player) return null
  const stats = computePlayerStats(player)

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="inventory-window aetheria-window" onClick={e => e.stopPropagation()} style={{ width: 760, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="aetheria-window-header">
          <span>🎒 Inventory</span>
          <div className="flex items-center gap-2">
            <span className="text-gold">🪙 {player.gold}</span>
            <button className="aetheria-window-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="aetheria-window-body">
          <div className="inventory-layout">
            {/* Equipment panel */}
            <div className="equipment-panel">
              <div className="text-gold text-sm font-bold mb-2">EQUIPMENT</div>
              <div className="equipment-slots">
                {['helmet', 'weapon', 'armor', 'shield', 'boots', 'trinket'].map(slot => {
                  const eq = player.equipment?.[slot]
                  const item = eq?.id ? getItem(eq.id) : null
                  return (
                    <div key={slot} className={`equipment-slot ${item ? 'filled' : ''}`} onClick={() => item && onUnequip(slot)}>
                      <div className="equipment-slot-label">{slot.toUpperCase()}</div>
                      {item ? (
                        <>
                          <div className="equipment-slot-icon">{item.icon}</div>
                          <div className="equipment-slot-name text-xs">{item.name}</div>
                        </>
                      ) : (
                        <div className="equipment-slot-empty">—</div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="text-gold text-sm font-bold mt-4 mb-2">STATS</div>
              <div className="equipment-stats">
                <div className="stat-row"><span>❤ Health</span><span className="font-bold">{player.hp}/{stats.hp}</span></div>
                <div className="stat-row"><span>✦ Mana</span><span className="font-bold">{player.mp}/{stats.mp}</span></div>
                <div className="stat-row"><span>⚔ Attack</span><span className="font-bold text-gold">{stats.attack}</span></div>
                <div className="stat-row"><span>🛡 Defense</span><span className="font-bold text-green">{stats.defense}</span></div>
                <div className="stat-row"><span>✧ Magic</span><span className="font-bold text-purple">{stats.magic}</span></div>
                <div className="stat-row"><span>⚡ Speed</span><span className="font-bold text-blue">{stats.speed}</span></div>
              </div>
            </div>

            {/* Inventory grid */}
            <div className="inventory-grid-panel">
              <div className="text-gold text-sm font-bold mb-2">ITEMS ({inventory.length})</div>
              <div className="inventory-grid">
                {inventory.length === 0 && <div className="text-dim text-center p-4">Your inventory is empty.</div>}
                {inventory.map((invItem, i) => {
                  const item = getItem(invItem.id)
                  if (!item) return null
                  const isSelected = selected?.i === i
                  return (
                    <div
                      key={i}
                      className={`inv-slot ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelected({ ...invItem, i, item })}
                      title={item.name}
                    >
                      <div className="inv-slot-icon">{item.icon}</div>
                      {invItem.qty > 1 && <div className="inv-slot-qty">x{invItem.qty}</div>}
                    </div>
                  )
                })}
              </div>

              {selected && (
                <div className="inv-detail-panel">
                  <div className="inv-detail-header">
                    <span className="text-gold font-bold">{selected.item.icon} {selected.item.name}</span>
                    {selected.qty > 1 && <span className="text-dim">x{selected.qty}</span>}
                  </div>
                  <div className="inv-detail-desc text-sm text-dim">{selected.item.desc}</div>
                  <div className="inv-detail-stats text-sm">
                    {selected.item.attack ? <span className="text-gold">⚔ +{selected.item.attack} </span> : null}
                    {selected.item.defense ? <span className="text-green">🛡 +{selected.item.defense} </span> : null}
                    {selected.item.magic ? <span className="text-purple">✧ +{selected.item.magic} </span> : null}
                    {selected.item.speed ? <span className="text-blue">⚡ +{selected.item.speed} </span> : null}
                    {selected.item.heal ? <span className="text-red">❤ +{selected.item.heal} </span> : null}
                    {selected.item.mana ? <span className="text-blue">✦ +{selected.item.mana} </span> : null}
                    {selected.item.hp ? <span className="text-red">❤ Max +{selected.item.hp} </span> : null}
                    {selected.item.mp ? <span className="text-blue">✦ Max +{selected.item.mp} </span> : null}
                  </div>
                  {selected.item.reqLevel && <div className="text-xs text-red">Requires level {selected.item.reqLevel}</div>}
                  <div className="inv-detail-value text-xs text-dim">Value: 🪙 {selected.item.value}</div>
                  <div className="inv-detail-actions">
                    {isEquipment(selected.item) && (
                      <button className="aetheria-btn aetheria-btn-primary text-sm" onClick={() => { onEquip(selected.id); setSelected(null) }}>
                        Equip
                      </button>
                    )}
                    {selected.item.type === 'consumable' && (
                      <button className="aetheria-btn aetheria-btn-success text-sm" onClick={() => onUse(selected.id)}>
                        Use
                      </button>
                    )}
                    {selected.item.value > 0 && selected.item.type !== 'quest' && selected.item.type !== 'key' && (
                      <button className="aetheria-btn text-sm" onClick={() => onSell(selected.id, 1)}>
                        Sell (🪙 {Math.floor(selected.item.value * 0.5)})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
