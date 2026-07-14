// End-to-end test: register, login, create character, connect via socket, verify state sync
import { io } from 'socket.io-client'

const SERVER_URL = 'http://localhost:4000'
const TEST_USER = `t${Date.now().toString().slice(-8)}`
const TEST_PASS = 'testpass123'
const TEST_CHAR_NAME = `H${Date.now().toString().slice(-6)}`

let pass = 0, fail = 0
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`) }
  else { fail++; console.error(`  ✗ ${msg}`) }
}

async function fetchJSON(url, options) {
  const r = await fetch(url, options)
  return r.json()
}

console.log('\n=== Aetheria Multiplayer E2E Test ===\n')

try {
  // 1. Register
  console.log('Step 1: Register')
  const regRes = await fetchJSON(`${SERVER_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
  })
  assert(regRes.ok, `Register success: ${regRes.username || regRes.error}`)
  const token = regRes.token

  // 2. Login (separate session)
  console.log('\nStep 2: Login')
  const loginRes = await fetchJSON(`${SERVER_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
  })
  assert(loginRes.ok, `Login success: ${loginRes.username || loginRes.error}`)

  // 3. List characters (should be empty)
  console.log('\nStep 3: List characters (should be empty)')
  const listRes = await fetchJSON(`${SERVER_URL}/api/characters`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  assert(listRes.ok, 'Character list fetched')
  assert(listRes.characters.length === 0, `Empty character list (${listRes.characters.length} chars)`)

  // 4. Connect socket
  console.log('\nStep 4: Connect WebSocket')
  const socket = io(SERVER_URL, { auth: { token } })
  await new Promise((resolve, reject) => {
    socket.on('connect', resolve)
    socket.on('connect_error', reject)
    setTimeout(() => reject(new Error('Socket connect timeout')), 5000)
  })
  assert(socket.connected, 'Socket connected')

  // 5. Create character via socket
  console.log('\nStep 5: Create character via socket')
  const charCreated = await new Promise((resolve) => {
    socket.once('character:created', (data) => resolve({ ok: true, data }))
    socket.once('error', (data) => resolve({ ok: false, data }))
    socket.emit('character:create', { name: TEST_CHAR_NAME, classId: 'warrior' })
    setTimeout(() => resolve(null), 5000)
  })
  if (charCreated?.ok) {
    assert(true, `Character created: ${charCreated.data.name}`)
  } else {
    assert(false, `Character created: failed — error: ${JSON.stringify(charCreated?.data || charCreated)}`)
  }
  const charId = charCreated?.data?.id

  // 6. List characters again (should have 1)
  console.log('\nStep 6: List characters (should have 1)')
  const listRes2 = await new Promise((resolve) => {
    socket.once('character:list', resolve)
    socket.emit('character:list')
    setTimeout(() => resolve(null), 5000)
  })
  assert(listRes2 !== null, 'Character list received via socket')
  assert(listRes2.characters.length === 1, `Has 1 character (${listRes2?.characters?.length || 0})`)

  // 7. Select character → should receive state:sync
  console.log('\nStep 7: Select character & receive state sync')
  const stateSync = await new Promise((resolve) => {
    socket.once('state:sync', resolve)
    socket.emit('character:select', { characterId: charId })
    setTimeout(() => resolve(null), 5000)
  })
  assert(stateSync !== null, 'State sync received')
  if (stateSync) {
    assert(stateSync.islandId === 'lumina', `On Lumina Isle (${stateSync.islandId})`)
    assert(stateSync.map && stateSync.map.length > 0, `Map received (${stateSync.map.length} rows)`)
    assert(stateSync.npcs && stateSync.npcs.length === 8, `8 NPCs on Lumina (${stateSync.npcs?.length})`)
    assert(stateSync.monsters && stateSync.monsters.length > 0, `Monsters spawned (${stateSync.monsters?.length})`)
    assert(stateSync.player && stateSync.player.name, `Player state received (${stateSync.player?.name})`)
    assert(stateSync.player.hp === 150, `Player HP = 150 (${stateSync.player?.hp})`)
    assert(stateSync.player.classDef?.name === 'Warrior', `Player class = Warrior (${stateSync.player?.classDef?.name})`)
  }

  // 8. Move player
  console.log('\nStep 8: Move player')
  const playerUpdate = await new Promise((resolve) => {
    socket.once('player:update', resolve)
    socket.emit('move', { dx: 1, dy: 0 })
    setTimeout(() => resolve(null), 1500)
  })
  // Note: movement might be blocked by walls (random map), so we just check we got SOME response
  // or no response (if blocked). Either way the server should not crash.
  console.log(`  (move response: ${playerUpdate ? 'received' : 'blocked/no-update'})`)

  // 9. Get character list via HTTP to verify persistence
  console.log('\nStep 9: Verify character persisted')
  const listRes3 = await fetchJSON(`${SERVER_URL}/api/characters`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  assert(listRes3.characters.length === 1, `Character still in DB (${listRes3.characters.length})`)
  assert(listRes3.characters[0].name === TEST_CHAR_NAME, `Character name matches`)

  // 10. Health endpoint
  console.log('\nStep 10: Health check')
  const health = await fetchJSON(`${SERVER_URL}/health`)
  assert(health.ok, `Server healthy (players: ${health.players}, uptime: ${health.uptime}s)`)

  socket.disconnect()
} catch (e) {
  console.error('Test error:', e.message)
  fail++
}

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
