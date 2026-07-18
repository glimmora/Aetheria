// ============================================================
// Mythral - Inventory system
// ============================================================

import { getItem, isEquipment } from './items.js'

export function addItemToInventory(inventory, itemId, qty = 1) {
  const item = getItem(itemId)
  if (!item) return inventory
  // All items stack by id (simpler UI; equip decrements qty)
  const existing = inventory.find(i => i.id === itemId)
  if (existing) {
    return inventory.map(i => i.id === itemId ? { ...i, qty: i.qty + qty } : i)
  }
  return [...inventory, { id: itemId, qty }]
}

export function removeItemFromInventory(inventory, itemId, qty = 1) {
  const item = getItem(itemId)
  if (!item) return inventory
  let remaining = qty
  const newInv = []
  for (const invItem of inventory) {
    if (invItem.id === itemId && remaining > 0) {
      if (invItem.qty > remaining) {
        newInv.push({ ...invItem, qty: invItem.qty - remaining })
        remaining = 0
      } else {
        remaining -= invItem.qty
      }
    } else {
      newInv.push(invItem)
    }
  }
  return newInv
}

export function countItem(inventory, itemId) {
  return inventory.filter(i => i.id === itemId).reduce((s, i) => s + i.qty, 0)
}

export function hasItem(inventory, itemId, qty = 1) {
  return countItem(inventory, itemId) >= qty
}

export function equipItem(player, inventory, itemId) {
  const item = getItem(itemId)
  if (!item || !isEquipment(item)) return { player, inventory }
  if (!hasItem(inventory, itemId, 1)) return { player, inventory }
  // remove from inventory
  let newInv = removeItemFromInventory(inventory, itemId, 1)
  const equipment = { ...(player.equipment || {}) }
  // return currently-equipped item to inventory
  const slot = item.slot
  if (equipment[slot] && equipment[slot].id) {
    newInv = addItemToInventory(newInv, equipment[slot].id, 1)
  }
  equipment[slot] = { id: itemId }
  return {
    player: { ...player, equipment },
    inventory: newInv,
  }
}

export function unequipItem(player, inventory, slot) {
  const equipment = { ...(player.equipment || {}) }
  const cur = equipment[slot]
  if (!cur || !cur.id) return { player, inventory }
  let newInv = addItemToInventory(inventory, cur.id, 1)
  equipment[slot] = null
  return {
    player: { ...player, equipment },
    inventory: newInv,
  }
}

export function useConsumable(player, inventory, itemId) {
  const item = getItem(itemId)
  if (!item || item.type !== 'consumable') return { player, inventory, message: '' }
  if (!hasItem(inventory, itemId, 1)) return { player, inventory, message: '' }
  let newPlayer = { ...player }
  let message = ''
  if (item.heal) {
    const healed = Math.min(item.heal, newPlayer.maxHp - newPlayer.hp)
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + item.heal)
    message = `Recovered ${healed} HP`
  }
  if (item.mana) {
    const restored = Math.min(item.mana, newPlayer.maxMp - newPlayer.mp)
    newPlayer.mp = Math.min(newPlayer.maxMp, newPlayer.mp + item.mana)
    message = `Recovered ${restored} MP`
  }
  if (item.buff) {
    newPlayer.buffs = [...(newPlayer.buffs || []), { ...item.buff, startTime: Date.now() }]
    message = `Buff applied: ${item.name}`
  }
  const newInv = removeItemFromInventory(inventory, itemId, 1)
  return { player: newPlayer, inventory: newInv, message }
}

export function sellItem(inventory, itemId, qty = 1) {
  const item = getItem(itemId)
  if (!item) return { inventory: inventory, gold: 0 }
  if (!hasItem(inventory, itemId, qty)) return { inventory, gold: 0 }
  const newInv = removeItemFromInventory(inventory, itemId, qty)
  const gold = Math.floor(item.value * 0.5) * qty
  return { inventory: newInv, gold }
}

export function buyItem(inventory, gold, itemId, qty = 1, price = 0) {
  const totalCost = price * qty
  if (gold < totalCost) return { inventory, gold, success: false }
  const newInv = addItemToInventory(inventory, itemId, qty)
  return { inventory: newInv, gold: gold - totalCost, success: true }
}
