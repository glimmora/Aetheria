#!/bin/bash
# Fix imports in client/src/components/ui/ and TileMap.jsx
# Replace ../../data/X.js -> ../../../../shared/X.js
# Replace ../../systems/X.js -> ../../../../shared/X.js

cd /home/z/my-project

for f in client/src/components/ui/*.jsx client/src/components/TileMap.jsx; do
  if [ -f "$f" ]; then
    sed -i "s|from '\.\./\.\./data/|from '../../../../shared/|g" "$f"
    sed -i "s|from '\.\./\.\./systems/|from '../../../../shared/|g" "$f"
  fi
done

echo "Done. Verifying..."
grep -rn "from '\.\./" client/src/components/ui/ client/src/components/TileMap.jsx | head -10
