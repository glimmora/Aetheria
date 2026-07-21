#!/bin/bash
set -e

PROJDIR="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  echo "Usage: $0 {start|stop|restart|status|logs}"
  echo ""
  echo "Commands:"
  echo "  start    Build client + start server (12400) + client (12000) via PM2"
  echo "  stop     Stop both PM2 processes"
  echo "  restart  Rebuild + restart both"
  echo "  status   Show PM2 status"
  echo "  logs     Tail PM2 logs"
  exit 1
}

CMD="${1:-}"
case "$CMD" in
  start)
    cd "$PROJDIR"
    echo "Building client..."
    npm run build -w client 2>&1 | tail -3
    echo ""
    echo "Starting server + client via PM2..."
    pm2 delete mythral-server 2>/dev/null || true
    pm2 delete mythral-client 2>/dev/null || true
    pm2 start ecosystem.config.cjs 2>&1
    sleep 3
    echo ""
    if curl -sf --max-time 3 http://localhost:12400/health > /dev/null 2>&1; then
      echo "  ✓ Server running at http://localhost:12400"
    else
      echo "  ⚠ Server may still be starting — check: pm2 logs mythral-server"
    fi
    if curl -sf --max-time 3 http://localhost:12000/ > /dev/null 2>&1; then
      echo "  ✓ Client running at http://localhost:12000"
    else
      echo "  ⚠ Client may still be starting — check: pm2 logs mythral-client"
    fi
    ;;
  stop)
    pm2 stop mythral-server mythral-client 2>&1
    echo "Both processes stopped"
    ;;
  restart)
    cd "$PROJDIR"
    echo "Building client..."
    npm run build -w client 2>&1 | tail -3
    pm2 restart mythral-server mythral-client --update-env 2>&1
    sleep 3
    echo "Both processes restarted"
    ;;
  status)
    pm2 status 2>&1
    ;;
  logs)
    pm2 logs mythral-server mythral-client --lines 50 2>&1
    ;;
  *)
    usage
    ;;
esac
