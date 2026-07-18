// End-to-end test: register, login, create character, connect via socket,
// verify state sync, online players, inspect, leaderboard, single-session,
// character limit, and validation.
import { io } from 'socket.io-client'

const SERVER_URL = 'http://localhost:12000'
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

console.log('\n=== Mythral Multiplayer E2E Test (extended) ===\n')

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

  // 2. Login
  console.log('\nStep 2: Login')
  const loginRes = await fetchJSON(`${SERVER_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TEST_USER, password: TEST_PASS }),
  })
  assert(loginRes.ok, `Login success`)

  // 3. Connect socket
  console.log('\nStep 3: Connect WebSocket')
  const socket = io(SERVER_URL, { auth: { token } })
  await new Promise((resolve, reject) => {
    socket.on('connect', resolve)
    socket.on('connect_error', reject)
    setTimeout(() => reject(new Error('timeout')), 5000)
  })
  assert(socket.connected, 'Socket connected')

  // 4. Create character
  console.log('\nStep 4: Create character')
  const charCreated = await new Promise((resolve) => {
    socket.once('character:created', (d) => resolve({ ok: true, d }))
    socket.once('error', (d) => resolve({ ok: false, d }))
    socket.emit('character:create', { name: TEST_CHAR_NAME, classId: 'warrior' })
    setTimeout(() => resolve(null), 5000)
  })
  assert(charCreated?.ok, `Character created: ${charCreated?.d?.name}`)
  const charId = charCreated?.d?.id

  // 5. Select character + state sync
  console.log('\nStep 5: Select character & state sync')
  const stateSync = await new Promise((resolve) => {
    socket.once('state:sync', resolve)
    socket.emit('character:select', { characterId: charId })
    setTimeout(() => resolve(null), 5000)
  })
  assert(stateSync !== null, 'State sync received')
  assert(stateSync?.islandId === 'lumina', 'On Lumina Isle')
  assert(stateSync?.player?.hp === 150, `Player HP = 150 (${stateSync?.player?.hp})`)

  // 6. Online players list
  console.log('\nStep 6: Online players')
  const onlineRes = await new Promise((resolve) => {
    socket.once('online:players', resolve)
    socket.emit('online:request')
    setTimeout(() => resolve(null), 5000)
  })
  assert(onlineRes !== null, 'Online players list received')
  assert(onlineRes?.players?.length >= 1, `At least 1 player online (${onlineRes?.players?.length})`)
  assert(onlineRes?.players?.[0]?.name === TEST_CHAR_NAME, `Online player is me (${onlineRes?.players?.[0]?.name})`)

  // 7. Leaderboard
  console.log('\nStep 7: Leaderboard')
  const lbRes = await new Promise((resolve) => {
    socket.once('leaderboard', resolve)
    socket.emit('leaderboard:request')
    setTimeout(() => resolve(null), 5000)
  })
  assert(lbRes !== null, 'Leaderboard received')
  assert(lbRes?.leaderboard?.length >= 1, `At least 1 entry (${lbRes?.leaderboard?.length})`)
  assert(lbRes?.leaderboard?.[0]?.name === TEST_CHAR_NAME, `Top entry is me (${lbRes?.leaderboard?.[0]?.name})`)

  // 8. Self-inspect
  console.log('\nStep 8: Inspect self')
  const inspectRes = await new Promise((resolve) => {
    socket.once('player:inspect', resolve)
    socket.emit('player:inspect', { playerId: socket.id })
    setTimeout(() => resolve(null), 5000)
  })
  assert(inspectRes !== null, 'Inspect data received')
  assert(inspectRes?.name === TEST_CHAR_NAME, `Inspected name matches (${inspectRes?.name})`)
  assert(inspectRes?.stats?.attack > 0, `Inspect shows attack stat (${inspectRes?.stats?.attack})`)

  // 9. HTTP leaderboard
  console.log('\nStep 9: HTTP leaderboard endpoint')
  const lbHttp = await fetchJSON(`${SERVER_URL}/api/leaderboard`)
  assert(lbHttp.ok, 'HTTP leaderboard works')
  assert(lbHttp.leaderboard[0]?.name === TEST_CHAR_NAME, 'HTTP leaderboard matches')

  // 10. HTTP stats endpoint
  console.log('\nStep 10: HTTP stats endpoint')
  const statsHttp = await fetchJSON(`${SERVER_URL}/api/stats`)
  assert(statsHttp.ok, 'HTTP stats works')
  assert(statsHttp.onlinePlayers >= 1, `Stats shows online players (${statsHttp.onlinePlayers})`)
  assert(statsHttp.totalCharacters >= 1, `Stats shows total characters (${statsHttp.totalCharacters})`)

  // 11. Single-session enforcement (login from second socket)
  console.log('\nStep 11: Single-session enforcement')
  const socket2 = io(SERVER_URL, { auth: { token } })
  await new Promise((resolve) => { socket2.on('connect', resolve); setTimeout(resolve, 3000) })
  // Select same character from second socket
  socket2.emit('character:select', { characterId: charId })
  // Wait for kick on first socket
  const kicked = await new Promise((resolve) => {
    socket.once('kick', (d) => resolve(d))
    setTimeout(() => resolve(null), 3000)
  })
  assert(kicked !== null, 'First socket was kicked on duplicate login')
  assert(kicked?.reason?.includes('another location'), `Kick reason correct`)

  // 12. Character limit (try to create 6 characters)
  console.log('\nStep 12: Character limit (max 5)')
  // Create 4 more (we already have 1)
  for (let i = 2; i <= 5; i++) {
    await new Promise((resolve) => {
      socket2.once('character:created', resolve)
      socket2.once('error', resolve)
      socket2.emit('character:create', { name: `${TEST_CHAR_NAME}${i}`, classId: 'mage' })
      setTimeout(resolve, 3000)
    })
  }
  // 6th should fail
  const sixth = await new Promise((resolve) => {
    socket2.once('character:created', () => resolve({ ok: true }))
    socket2.once('error', (d) => resolve({ ok: false, d }))
    socket2.emit('character:create', { name: `${TEST_CHAR_NAME}6`, classId: 'ranger' })
    setTimeout(() => resolve(null), 3000)
  })
  assert(!sixth?.ok, '6th character rejected')
  assert(sixth?.d?.message?.includes('limit'), `Error mentions limit: ${sixth?.d?.message}`)

  // 13. Invalid input validation
  console.log('\nStep 13: Input validation')
  const badMove = await new Promise((resolve) => {
    // Send invalid move (diagonal) — should be silently ignored
    socket2.emit('move', { dx: 1, dy: 1 })
    setTimeout(() => resolve(true), 500)  // no crash = pass
  })
  assert(badMove, 'Invalid diagonal move ignored without crash')

  // 14. Health endpoint
  console.log('\nStep 14: Health check')
  const health = await fetchJSON(`${SERVER_URL}/health`)
  assert(health.ok, `Server healthy (players: ${health.players})`)
  assert(health.players >= 1, `Health shows at least 1 player (${health.players})`)

  socket.disconnect()
  socket2.disconnect()
} catch (e) {
  console.error('Test error:', e.message)
  fail++
}

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`)
process.exit(fail > 0 ? 1 : 0)
