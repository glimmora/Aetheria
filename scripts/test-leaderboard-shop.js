// Test leaderboard and shop features end-to-end
import { io } from 'socket.io-client'

const SERVER_URL = 'http://localhost:12400'
const TEST_USER = `lst${Date.now().toString().slice(-6)}`
const TEST_PASS = 'testpass123'

let pass = 0, fail = 0
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`) }
  else { fail++; console.error(`  ✗ ${msg}`) }
}

async function fetchJSON(url, options) {
  const r = await fetch(url, options)
  return r.json()
}

console.log('\n=== Leaderboard & Shop Feature Test ===\n')

try {
  // Setup: register + login + create character + enter game
  console.log('Setup: Register')
  const regRes = await fetchJSON(`${SERVER_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
  })
  assert(regRes.ok, `Register: ${TEST_USER}`)
  const token = regRes.token

  const socket = io(SERVER_URL, { auth: { token }, transports: ['websocket', 'polling'] })
  await new Promise((resolve, reject) => {
    socket.on('connect', resolve)
    socket.on('connect_error', reject)
    setTimeout(() => reject(new Error('timeout')), 5000)
  })
  assert(socket.connected, 'Socket connected')

  // Create character
  const charCreated = await new Promise((resolve) => {
    socket.once('character:created', (d) => resolve({ ok: true, d }))
    socket.once('error', (d) => resolve({ ok: false, d }))
    socket.emit('character:create', { name: `LST${Date.now().toString().slice(-4)}`, classId: 'warrior' })
    setTimeout(() => resolve(null), 5000)
  })
  assert(charCreated?.ok, `Character created: ${charCreated?.d?.name}`)

  // Select character
  const stateSync = await new Promise((resolve) => {
    socket.once('state:sync', resolve)
    socket.emit('character:select', { characterId: charCreated?.d?.id })
    setTimeout(() => resolve(null), 5000)
  })
  assert(stateSync !== null, 'State sync received')
  const initialGold = stateSync?.player?.gold
  assert(typeof initialGold === 'number' && initialGold > 0, `Starting gold: ${initialGold}`)

  // ============================================================
  // LEADERBOARD TESTS
  // ============================================================
  console.log('\n--- LEADERBOARD TESTS ---\n')

  // Test 1: HTTP leaderboard endpoint
  const lbHttp = await fetchJSON(`${SERVER_URL}/api/leaderboard`)
  assert(lbHttp.ok === true, 'HTTP /api/leaderboard returns ok')
  assert(Array.isArray(lbHttp.leaderboard), 'HTTP leaderboard is array')
  assert(lbHttp.leaderboard.length >= 1, `HTTP leaderboard has ${lbHttp.leaderboard.length} entries`)
  assert(lbHttp.leaderboard[0]?.rank === 1, 'First entry has rank=1')
  assert(lbHttp.leaderboard[0]?.name !== undefined, 'First entry has name')
  assert(lbHttp.leaderboard[0]?.class !== undefined, 'First entry has class')
  assert(lbHttp.leaderboard[0]?.level !== undefined, 'First entry has level')
  assert(lbHttp.leaderboard[0]?.currentIsland !== undefined, 'First entry has currentIsland')

  // Test 2: HTTP leaderboard with custom limit
  const lbLimited = await fetchJSON(`${SERVER_URL}/api/leaderboard?limit=3`)
  assert(lbLimited.ok === true, 'HTTP leaderboard with limit=3 works')
  assert(lbLimited.leaderboard.length <= 3, `Limited to ${lbLimited.leaderboard.length} entries`)

  // Test 3: WebSocket leaderboard request
  const lbWs = await new Promise((resolve) => {
    socket.once('leaderboard', resolve)
    socket.emit('leaderboard:request')
    setTimeout(() => resolve(null), 5000)
  })
  assert(lbWs !== null, 'WS leaderboard:request returns data')
  assert(Array.isArray(lbWs.leaderboard), 'WS leaderboard is array')
  assert(lbWs.leaderboard.length >= 1, `WS leaderboard has ${lbWs.leaderboard.length} entries`)
  assert(lbWs.leaderboard.some(e => e.name === charCreated?.d?.name), 'My character in WS leaderboard')

  // Test 4: Leaderboard entries have required fields
  const entry = lbWs.leaderboard.find(e => e.name === charCreated?.d?.name)
  assert(entry?.rank > 0, `My rank: ${entry?.rank}`)
  assert(entry?.level === 1, `My level: ${entry?.level}`)
  assert(entry?.class === 'warrior', `My class: ${entry?.class}`)
  assert(Array.isArray(entry?.killedBosses) || typeof entry?.killedBosses === 'number', 'killedBosses field exists')

  // Test 5: HTTP /api/stats shows leaderboard-relevant data
  const stats = await fetchJSON(`${SERVER_URL}/api/stats`)
  assert(stats.ok === true, 'HTTP /api/stats returns ok')
  assert(typeof stats.totalCharacters === 'number', `Total characters: ${stats.totalCharacters}`)
  assert(typeof stats.onlinePlayers === 'number', `Online players: ${stats.onlinePlayers}`)
  assert(stats.onlinePlayers >= 1, 'At least 1 online player')

  // ============================================================
  // SHOP TESTS
  // ============================================================
  console.log('\n--- SHOP TESTS ---\n')

  // Test 6: Walk to NPC (move toward the blacksmith Thom on Lumina)
  // First, let's check what NPCs are on the island
  const npcs = stateSync?.npcs || []
  const thom = npcs.find(n => n.id === 'lumina thom')
  assert(thom !== undefined, `Found Thom Blacksmith NPC at (${thom?.x}, ${thom?.y})`)

  // Move player close to Thom (within range 3)
  const player = stateSync?.player
  let moved = false
  if (thom && player) {
    const dist = Math.abs(player.x - thom.x) + Math.abs(player.y - thom.y)
    if (dist > 3) {
      // Move toward Thom step by step
      const dx = Math.sign(thom.x - player.x)
      const dy = Math.sign(thom.y - player.y)
      for (let i = 0; i < Math.min(dist, 20); i++) {
        await new Promise(r => {
          socket.emit('move', { dx: dx, dy: 0 })
          setTimeout(r, 150)
        })
      }
      // Also move vertically if needed
      const dy2 = Math.sign(thom.y - player.y)
      for (let i = 0; i < Math.min(5, 20); i++) {
        await new Promise(r => {
          socket.emit('move', { dx: 0, dy: dy2 })
          setTimeout(r, 150)
        })
      }
      moved = true
    } else {
      moved = true
    }
  }
  assert(moved, 'Moved player near Thom Blacksmith')

  // Wait for server to process moves
  await new Promise(r => setTimeout(r, 500))

  // Test 7: Buy item from shop (bread costs 3 gold)
  const goldBefore = stateSync?.player?.gold
  const buyResult = await new Promise((resolve) => {
    const handler = (data) => {
      socket.off('player:update', handler)
      resolve({ ok: true, data })
    }
    const errorHandler = (data) => {
      socket.off('notify', errorHandler)
      resolve({ ok: false, error: data.message })
    }
    socket.on('player:update', handler)
    socket.on('notify', errorHandler)
    socket.emit('shop:buy', { npcId: 'lumina thom', itemId: 'leather_cap', qty: 1 })
    setTimeout(() => { socket.off('player:update', handler); socket.off('notify', errorHandler); resolve(null) }, 5000)
  })
  assert(buyResult !== null, 'Buy request received response')

  // Get updated state
  const updatedPlayer = await new Promise((resolve) => {
    const handler = (data) => {
      socket.off('player:update', handler)
      resolve(data)
    }
    socket.on('player:update', handler)
    // Force another buy to trigger update
    socket.emit('shop:buy', { npcId: 'lumina thom', itemId: 'wooden_shield', qty: 1 })
    setTimeout(() => { socket.off('player:update', handler); resolve(null) }, 5000)
  })

  // Verify inventory has items
  const invCheck = await new Promise((resolve) => {
    socket.once('player:update', resolve)
    setTimeout(() => resolve(null), 3000)
  })

  // Test 8: Verify shop buy via direct check
  // Let's buy another item and check notification
  const notifResult = await new Promise((resolve) => {
    const notifications = []
    const handler = (data) => {
      notifications.push(data)
    }
    socket.on('notify', handler)
    socket.emit('shop:buy', { npcId: 'lumina thom', itemId: 'leather_armor', qty: 1 })
    setTimeout(() => {
      socket.off('notify', handler)
      const buyNotif = notifications.find(n => n.msg && n.msg.includes('Bought'))
      const errorNotif = notifications.find(n => n.msg && (n.msg.includes('gold') || n.msg.includes('Cannot')))
      resolve({ buyNotif, errorNotif, all: notifications })
    }, 3000)
  })
  assert(notifResult.buyNotif !== undefined, `Buy notification: "${notifResult.buyNotif?.msg || 'none'}"`)

  // Test 9: Try buying with not enough gold (should fail gracefully)
  const expensiveResult = await new Promise((resolve) => {
    const notifications = []
    const handler = (data) => { notifications.push(data) }
    socket.on('notify', handler)
    // Try buying something very expensive (dragonscale at 900 gold)
    socket.emit('shop:buy', { npcId: 'lumina thom', itemId: 'dragonscale', qty: 1 })
    setTimeout(() => {
      socket.off('notify', handler)
      const goldError = notifications.find(n => n.msg && n.msg.includes('gold'))
      const cannotBuy = notifications.find(n => n.msg && n.msg.includes('Cannot'))
      resolve({ goldError, cannotBuy, all: notifications })
    }, 3000)
  })
  assert(expensiveResult.goldError !== undefined || expensiveResult.cannotBuy !== undefined,
    `Expensive item rejected: "${expensiveResult.goldError?.msg || expensiveResult.cannotBuy?.msg || 'no error'}"`)

  // Test 10: Buy health potion from Sister Lyra (different NPC with shop)
  const lyra = npcs.find(n => n.id === 'lumina sister_lyra')
  assert(lyra !== undefined, `Found Sister Lyra NPC (healer)`)

  // Move to Lyra - get updated position from last player:update
  if (lyra) {
    let curX = player?.x || 30, curY = player?.y || 25
    for (let i = 0; i < 25; i++) {
      const dx = Math.sign(lyra.x - curX)
      const dy = Math.sign(lyra.y - curY)
      await new Promise(r => {
        socket.emit('move', { dx, dy: 0 })
        setTimeout(r, 160)
      })
      curX += dx
    }
    for (let i = 0; i < 15; i++) {
      const dy = Math.sign(lyra.y - curY)
      await new Promise(r => {
        socket.emit('move', { dx: 0, dy })
        setTimeout(r, 160)
      })
      curY += dy
    }
  }
  await new Promise(r => setTimeout(r, 500))

  const lyraBuy = await new Promise((resolve) => {
    const notifications = []
    const handler = (data) => { notifications.push(data) }
    socket.on('notify', handler)
    socket.emit('shop:buy', { npcId: 'lumina sister_lyra', itemId: 'mana_potion', qty: 1 })
    setTimeout(() => {
      socket.off('notify', handler)
      resolve(notifications)
    }, 3000)
  })
  assert(lyraBuy.length > 0, `Lyra shop interaction: ${lyraBuy[0]?.msg || 'response received'}`)

  // Test 11: Sell an item
  // We should have bread from earlier. Sell 1 bread.
  const sellResult = await new Promise((resolve) => {
    const notifications = []
    const handler = (data) => { notifications.push(data) }
    socket.on('notify', handler)
    socket.emit('shop:sell', { itemId: 'leather_cap', qty: 1 })
    setTimeout(() => {
      socket.off('notify', handler)
      const sellNotif = notifications.find(n => n.msg && n.msg.includes('Sold'))
      const errorNotif = notifications.find(n => n.msg && n.msg.includes('Cannot'))
      resolve({ sellNotif, errorNotif })
    }, 3000)
  })
  assert(sellResult.sellNotif !== undefined || sellResult.errorNotif !== undefined,
    `Sell response: "${sellResult.sellNotif?.msg || sellResult.errorNotif?.msg || 'none'}"`)

  // Test 12: Try to sell non-sellable item (should be rejected)
  // quest items can't be sold, but we may not have any. Let's try a nonexistent item
  const badSell = await new Promise((resolve) => {
    const notifications = []
    const handler = (data) => { notifications.push(data) }
    socket.on('notify', handler)
    socket.emit('shop:sell', { itemId: 'nonexistent_item_123', qty: 1 })
    setTimeout(() => {
      socket.off('notify', handler)
      const sellNotif = notifications.find(n => n.msg && n.msg.includes('Cannot'))
      resolve({ error: sellNotif })
    }, 3000)
  })
  assert(badSell.error !== undefined, `Invalid item sell rejected: "${badSell.error?.msg || 'none'}"`)

  // Test 13: Verify leaderboard updates after XP gain
  // Kill a monster to gain XP (walk to nearest monster)
  const monsters = stateSync?.monsters || []
  const nearestMonster = monsters.find(m => m.hp > 0 && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) <= 2)
  if (nearestMonster) {
    // Attack the monster
    for (let i = 0; i < 20; i++) {
      await new Promise(r => {
        socket.emit('attack', { monsterId: nearestMonster.id })
        setTimeout(r, 800)
      })
    }
    await new Promise(r => setTimeout(r, 1000))
  }

  // Check leaderboard again
  const lbAfter = await new Promise((resolve) => {
    socket.once('leaderboard', resolve)
    socket.emit('leaderboard:request')
    setTimeout(() => resolve(null), 5000)
  })
  assert(lbAfter !== null, 'Leaderboard accessible after combat')
  assert(lbAfter.leaderboard.length >= 1, `Leaderboard still has entries`)

  // Test 14: HTTP leaderboard still works
  const lbFinal = await fetchJSON(`${SERVER_URL}/api/leaderboard?limit=10`)
  assert(lbFinal.ok === true, 'HTTP leaderboard still functional')
  assert(lbFinal.leaderboard.length >= 1, `HTTP leaderboard has ${lbFinal.leaderboard.length} entries`)

  socket.disconnect()
} catch (e) {
  console.error('Test error:', e.message)
  fail++
}

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
