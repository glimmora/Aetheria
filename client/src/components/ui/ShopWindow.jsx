// ============================================================
// Mythral - Shop Window
// ============================================================

import React, { useState } from 'react'
import { getItem, isEquipment } from '../../../../shared/items.js'

export default function ShopWindow({ activeShop, player, inventory, onClose, onBuy, onSell }) {
  const [mode, setMode] = useState('buy')
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(1)
  if (!activeShop) return null
  const npc = activeShop.npc
  const shop = npc.shop

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="shop-window mythral-window" onClick={e => e.stopPropagation()} style={{ width: 720, maxWidth: '95vw', maxHeight: '85vh' }}>
        <div className="mythral-window-header">
          <span>🛒 {shop.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-gold">🪙 {player.gold}</span>
            <button className="mythral-window-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="mythral-window-body">
          <div className="shop-tabs">
            <button className={`shop-tab ${mode === 'buy' ? 'active' : ''}`} onClick={() => { setMode('buy'); setSelected(null) }}>Buy</button>
            <button className={`shop-tab ${mode === 'sell' ? 'active' : ''}`} onClick={() => { setMode('sell'); setSelected(null) }}>Sell</button>
          </div>

          {mode === 'buy' ? (
            <div className="shop-items">
              {shop.items.map((entry, i) => {
                const item = getItem(entry.id)
                if (!item) return null
                const canAfford = player.gold >= entry.price * qty
                const meetsLevel = !item.reqLevel || player.level >= item.reqLevel
                return (
                  <div
                    key={i}
                    className={`shop-item ${selected?.id === entry.id ? 'selected' : ''} ${!canAfford || !meetsLevel ? 'disabled' : ''}`}
                    onClick={() => { setSelected({ id: entry.id, price: entry.price, item }); setQty(1) }}
                  >
                    <div className="shop-item-icon">{item.icon}</div>
                    <div className="shop-item-info">
                      <div className="shop-item-name">{item.name}</div>
                      <div className="shop-item-desc text-xs text-dim">{item.desc}</div>
                      {item.reqLevel && <div className="text-xs text-red">Requires level {item.reqLevel}</div>}
                      <div className="shop-item-stats text-xs">
                        {item.attack ? <span className="text-gold">⚔ {item.attack} </span> : null}
                        {item.defense ? <span className="text-green">🛡 {item.defense} </span> : null}
                        {item.magic ? <span className="text-purple">✧ {item.magic} </span> : null}
                        {item.heal ? <span className="text-red">❤ +{item.heal} </span> : null}
                        {item.mana ? <span className="text-blue">✦ +{item.mana} </span> : null}
                      </div>
                    </div>
                    <div className="shop-item-price">
                      <span className="text-gold">🪙 {entry.price}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="shop-items">
              {inventory.length === 0 && <div className="text-dim text-center p-4">Your inventory is empty.</div>}
              {inventory.map((invItem, i) => {
                const item = getItem(invItem.id)
                if (!item) return null
                const sellPrice = Math.floor(item.value * 0.5)
                if (sellPrice <= 0) return null
                return (
                  <div
                    key={i}
                    className={`shop-item ${selected?.id === invItem.id ? 'selected' : ''}`}
                    onClick={() => { setSelected({ id: invItem.id, price: sellPrice, item, maxQty: invItem.qty }); setQty(1) }}
                  >
                    <div className="shop-item-icon">{item.icon}</div>
                    <div className="shop-item-info">
                      <div className="shop-item-name">{item.name} <span className="text-dim">x{invItem.qty}</span></div>
                      <div className="shop-item-desc text-xs text-dim">{item.desc}</div>
                    </div>
                    <div className="shop-item-price">
                      <span className="text-gold">🪙 {sellPrice}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selected && (
            <div className="shop-buy-panel">
              <div className="shop-buy-info">
                <span className="text-gold font-bold">{selected.item.name}</span>
                <span className="text-dim text-sm">x{qty} = 🪙 {selected.price * qty}</span>
              </div>
              <div className="shop-buy-controls">
                <button className="mythral-btn text-sm" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
                <input
                  type="number"
                  value={qty}
                  min="1"
                  max={selected.maxQty || 99}
                  onChange={e => setQty(Math.max(1, Math.min(selected.maxQty || 99, parseInt(e.target.value) || 1)))}
                  className="shop-qty-input"
                />
                <button className="mythral-btn text-sm" onClick={() => setQty(Math.min(selected.maxQty || 99, qty + 1))}>+</button>
                <button
                  className="mythral-btn mythral-btn-success"
                  onClick={() => {
                    if (mode === 'buy') onBuy(selected.id, selected.price, qty)
                    else onSell(selected.id, qty)
                  }}
                  disabled={player.gold < selected.price * qty && mode === 'buy'}
                >
                  {mode === 'buy' ? 'Buy' : 'Sell'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
