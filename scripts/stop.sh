#!/bin/bash
# Standalone stop script — delegates to dev.sh
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/dev.sh" stop
