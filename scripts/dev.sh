#!/bin/bash
set -e

PROJDIR="$(cd "$(dirname "$0")/.." && pwd)"
PIDFILE="/tmp/mythral-server.pid"
CLIENT_PIDFILE="/tmp/mythral-client.pid"
LOGDIR="/tmp/mythral-logs"

mkdir -p "$LOGDIR"

usage() {
  echo "Usage: $0 {start|stop|restart|status|clean}"
  echo ""
  echo "Commands:"
  echo "  start    Start server + client (dev mode)"
  echo "  stop     Stop server + client"
  echo "  restart  Stop then start"
  echo "  status   Show running processes"
  echo "  clean    Kill all stale Mythral processes"
  exit 1
}

check_deps() {
  if [ ! -d "$PROJDIR/node_modules" ]; then
    echo "  ⚠ node_modules not found — running npm install..."
    cd "$PROJDIR" && npm install
    echo "  ✓ npm install complete"
  fi
}

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Port $port in use — stopping..."
    kill $pids 2>/dev/null || true
    sleep 1
    pids=$(lsof -ti:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
      sleep 1
    fi
  fi
}

kill_pidfile() {
  local pidfile=$1
  local name=$2
  if [ -f "$pidfile" ]; then
    local pid
    pid=$(cat "$pidfile" 2>/dev/null || echo "")
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      echo "  $name stopped (PID $pid)"
    fi
    rm -f "$pidfile"
  fi
}

kill_all_mythral() {
  local killed=0
  local pids
  # Kill server
  pids=$(ps aux | grep -E "node.*server/index\.js" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    killed=1
  fi
  # Kill vite dev server for client
  pids=$(ps aux | grep -E "vite.*client/vite\.config" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    killed=1
  fi
  # Kill any vite process on client port (12000)
  pids=$(lsof -ti:12000 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    killed=1
  fi
  if [ "$killed" = "1" ]; then
    sleep 1
    pids=$(ps aux | grep -E "(server/index\.js|vite.*client/vite\.config)" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
      sleep 1
    fi
    echo "  All Mythral processes cleaned"
  else
    echo "  No Mythral processes found"
  fi
  rm -f "$PIDFILE" "$CLIENT_PIDFILE"
}

start_server() {
  if [ -f "$PIDFILE" ]; then
    local pid
    pid=$(cat "$PIDFILE" 2>/dev/null || echo "")
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Server already running (PID $pid)"
      return
    fi
    rm -f "$PIDFILE"
  fi
  kill_port 12400
  cd "$PROJDIR"
  setsid node server/index.js > "$LOGDIR/server.log" 2>&1 &
  local pid=$!
  echo $pid > "$PIDFILE"
  echo "Server started (PID $pid) — log: $LOGDIR/server.log"
  # Wait for health check (up to 10s)
  local waited=0
  while [ $waited -lt 10 ]; do
    if curl -sf http://localhost:12400/health > /dev/null 2>&1; then
      echo "  ✓ Health check OK"
      return
    fi
    sleep 1
    waited=$((waited + 1))
  done
  echo "  ⚠ Server health check timed out — check $LOGDIR/server.log"
}

start_client() {
  if [ -f "$CLIENT_PIDFILE" ]; then
    local pid
    pid=$(cat "$CLIENT_PIDFILE" 2>/dev/null || echo "")
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Client already running (PID $pid)"
      return
    fi
    rm -f "$CLIENT_PIDFILE"
  fi
  kill_port 12000
  # Run Vite from client/ dir (its natural root) with setsid to survive shell exit
  setsid sh -c "cd \"$PROJDIR/client\" && exec \"$PROJDIR/node_modules/.bin/vite\" --port 12000 --host 0.0.0.0" > "$LOGDIR/client.log" 2>&1 &
  local pid=$!
  echo $pid > "$CLIENT_PIDFILE"
  echo "Client started (PID $pid) — log: $LOGDIR/client.log"
  # Wait for client (up to 15s)
  local waited=0
  while [ $waited -lt 15 ]; do
    if curl -sf http://localhost:12000/ > /dev/null 2>&1; then
      echo "  ✓ Client OK at http://localhost:12000"
      return
    fi
    sleep 1
    waited=$((waited + 1))
  done
  echo "  ⚠ Client not ready yet — check $LOGDIR/client.log"
}

stop_server() {
  kill_pidfile "$PIDFILE" "Server"
  kill_port 12400
}

stop_client() {
  kill_pidfile "$CLIENT_PIDFILE" "Client"
  kill_port 12000
}

show_status() {
  echo "=== Mythral Dev Status ==="
  local server_pid=""
  local client_pid=""
  if [ -f "$PIDFILE" ]; then
    server_pid=$(cat "$PIDFILE" 2>/dev/null || echo "")
  fi
  if [ -n "$server_pid" ] && kill -0 "$server_pid" 2>/dev/null; then
    echo "  Server: running (PID $server_pid) — http://localhost:12400"
  else
    server_pid=$(lsof -ti:12400 2>/dev/null || true)
    if [ -n "$server_pid" ]; then
      echo "  Server: running (PID $server_pid, no PID file) — http://localhost:12400"
    else
      echo "  Server: stopped"
    fi
  fi
  if [ -f "$CLIENT_PIDFILE" ]; then
    client_pid=$(cat "$CLIENT_PIDFILE" 2>/dev/null || echo "")
  fi
  if [ -n "$client_pid" ] && kill -0 "$client_pid" 2>/dev/null; then
    echo "  Client: running (PID $client_pid) — http://localhost:12000"
  else
    client_pid=$(lsof -ti:12000 2>/dev/null || true)
    if [ -n "$client_pid" ]; then
      echo "  Client: running (PID $client_pid, no PID file) — http://localhost:12000"
    else
      echo "  Client: stopped"
    fi
  fi
}

CMD="${1:-}"
case "$CMD" in
  start)
    echo "Starting Mythral (dev)..."
    check_deps
    start_server
    start_client
    echo ""
    echo "Done. Server: http://localhost:12400 | Client: http://localhost:12000"
    echo "Stop with: $0 stop"
    ;;
  stop)
    echo "Stopping Mythral..."
    stop_server
    stop_client
    echo "Done."
    ;;
  restart)
    echo "Restarting Mythral (dev)..."
    stop_server
    stop_client
    sleep 1
    start_server
    start_client
    echo ""
    echo "Done. Server: http://localhost:12400 | Client: http://localhost:12000"
    ;;
  status)
    show_status
    ;;
  clean)
    echo "Cleaning up Mythral processes..."
    kill_all_mythral
    ;;
  *)
    usage
    ;;
esac
