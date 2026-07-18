# HTTP API Reference

Mythral exposes a small REST API for authentication and character management. All real-time game traffic flows over Socket.io (see [Protocol Reference](./PROTOCOL.md)).

**Base URL:** `http://localhost:12000` (or your production server URL)

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [POST /api/register](#post-apiregister)
  - [POST /api/login](#post-apilogin)
  - [GET /api/characters](#get-apicharacters)
  - [GET /health](#get-health)
- [Error format](#error-format)
- [Rate limiting](#rate-limiting)
- [CORS](#cors)

---

## Authentication

Authentication uses **JWT bearer tokens**.

1. Register or login to receive a token:
   ```
   POST /api/register { username, password } → { ok, token, username }
   ```
2. Include the token in the `Authorization` header for protected endpoints:
   ```
   Authorization: Bearer <token>
   ```
3. Tokens expire after **7 days**. There is no refresh endpoint — the client must re-login.

### Token payload

The JWT payload contains:
```json
{
  "username": "bob",
  "iat": 1700000000,
  "exp": 1700604800
}
```

Tokens are signed with `JWT_SECRET` (environment variable). **Change this in production.**

---

## Endpoints

### POST /api/register

Create a new user account.

**Request body:**
```json
{
  "username": "bob",
  "password": "secret123"
}
```

**Validation:**
- `username`: 3-20 chars, regex `^[a-zA-Z0-9_-]+$`
- `password`: 6-100 chars

**Success response (200):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "bob"
}
```

**Error responses:**
- `400 Bad Request` — invalid username or password
  ```json
  { "error": "Username must be at least 3 characters" }
  ```
- `409 Conflict` — username already taken
  ```json
  { "error": "Username already taken" }
  ```

**Example (curl):**
```bash
curl -X POST http://localhost:12000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"secret123"}'
```

**Example (fetch):**
```js
const res = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'bob', password: 'secret123' }),
})
const data = await res.json()
if (data.ok) {
  localStorage.setItem('mythral_token', data.token)
}
```

---

### POST /api/login

Authenticate an existing user.

**Request body:**
```json
{
  "username": "bob",
  "password": "secret123"
}
```

**Success response (200):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "username": "bob"
}
```

**Error responses:**
- `401 Unauthorized` — invalid credentials
  ```json
  { "error": "Invalid credentials" }
  ```

**Notes:**
- Usernames are case-insensitive (stored lowercase)
- Passwords are compared using `bcrypt.compare` (constant-time)
- The error message is the same whether the username doesn't exist or the password is wrong (to prevent user enumeration)

---

### GET /api/characters

List all characters owned by the authenticated user. **Requires JWT.**

**Request:**
```
GET /api/characters
Authorization: Bearer <token>
```

**Success response (200):**
```json
{
  "ok": true,
  "characters": [
    {
      "id": "char_1700000000_ab12cd",
      "name": "Bob",
      "class": "warrior",
      "level": 12,
      "currentIsland": "emberfall"
    },
    {
      "id": "char_1700000001_ef34gh",
      "name": "Bobina",
      "class": "mage",
      "level": 5,
      "currentIsland": "lumina"
    }
  ]
}
```

**Error responses:**
- `401 Unauthorized` — missing or invalid token
  ```json
  { "error": "No token" }
  // or
  { "error": "Invalid token" }
  ```

**Notes:**
- Only the character summary is returned (not inventory, equipment, etc.)
- Full character state is loaded only when the player selects a character via Socket.io

**Example (curl):**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl http://localhost:12000/api/characters \
  -H "Authorization: Bearer $TOKEN"
```

---

### GET /health

Public health-check endpoint. Does not require authentication.

**Success response (200):**
```json
{
  "ok": true,
  "players": 3,
  "uptime": 1234.567
}
```

**Fields:**
- `ok` — always `true` if the server is running
- `players` — number of currently-connected socket sessions (not necessarily in-game)
- `uptime` — server uptime in seconds

**Use this for:**
- Load balancer health checks
- Uptime monitoring (e.g., UptimeRobot, Pingdom)
- Docker `HEALTHCHECK`

**Example (curl):**
```bash
curl http://localhost:12000/health
```

---

## Error format

All error responses follow this shape:

```json
{
  "error": "Human-readable error message"
}
```

For 4xx errors, the message is safe to display to the user. For 5xx errors, the message is generic ("Internal server error") and the details are logged server-side.

---

## Rate limiting

**Currently not implemented.** The server trusts clients to not abuse the API. For production, add a rate limiter like `express-rate-limit`:

```js
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                  // 100 requests per IP per window
})

app.use('/api/', limiter)
```

Apply stricter limits to auth endpoints:
```js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,   // 10 login/register attempts per 15 min
})
app.use('/api/login', authLimiter)
app.use('/api/register', authLimiter)
```

---

## CORS

The server allows requests from `CLIENT_ORIGIN` (defaults to `http://localhost:5173` for dev).

To change this:
```bash
CLIENT_ORIGIN=https://your-domain.com node server/index.js
```

For production with a separate client domain, set this to your client's origin. For same-origin (client served by Express), set it to the same domain.

The server currently uses `cors({ origin: true, credentials: true })` which reflects any Origin header back. For stricter security in production:

```js
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}))
```

---

## See also

- **[Protocol Reference](./PROTOCOL.md)** — Socket.io events for real-time gameplay
- **[Configuration](./CONFIGURATION.md)** — All environment variables
- **[Deployment](./DEPLOYMENT.md)** — Production setup
