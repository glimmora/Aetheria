#!/bin/bash
# Comprehensive rename: Mythral → Mythral
# Handles all case variations and compound forms

cd /home/z/my-project

# Find all relevant files (excluding node_modules, .git, dist, data)
FILES=$(find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.json" -o -name "*.html" -o -name "*.css" -o -name "*.sh" -o -name ".env*" \) \
  ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./dist/*" ! -path "./data/*" ! -path "./client/dist/*" ! -path "./.env.example")

echo "Files to process:"
echo "$FILES" | wc -l

for f in $FILES; do
  if [ -f "$f" ]; then
    # Order matters: most specific patterns first
    
    # "Mythral" → "Mythral" (full title)
    sed -i 's/Mythral/Mythral/g' "$f"
    
    # "mythral" → "mythral" (package name with hyphens)
    sed -i 's/mythral/mythral/g' "$f"
    
    # "mythral-client" → "mythral-client"
    sed -i 's/mythral-client/mythral-client/g' "$f"
    
    # "mythral-server" → "mythral-server"
    sed -i 's/mythral-server/mythral-server/g' "$f"
    
    # "mythral_token" → "mythral_token" (localStorage key)
    sed -i 's/mythral_token/mythral_token/g' "$f"
    
    # "mythral_settings" → "mythral_settings" (localStorage key)
    sed -i 's/mythral_settings/mythral_settings/g' "$f"
    
    # "mythral-dev-secret" → "mythral-dev-secret" (JWT default)
    sed -i 's/mythral-dev-secret/mythral-dev-secret/g' "$f"
    
    # "mythral" → "mythral" (lowercase: comments, paths, etc.)
    sed -i 's/mythral/mythral/g' "$f"
    
    # "Mythral" → "Mythral" (title case: game name, titles)
    sed -i 's/Mythral/Mythral/g' "$f"
    
    # "MYTHRAL" → "MYTHRAL" (uppercase: if any constants)
    sed -i 's/MYTHRAL/MYTHRAL/g' "$f"
  fi
done

echo "Done. Verifying no remaining references..."
REMAINING=$(grep -rni "mythral" --include="*.js" --include="*.jsx" --include="*.md" --include="*.json" --include="*.html" --include="*.css" . 2>/dev/null | grep -v node_modules | grep -v ".git/" | grep -v "dist/" | grep -v "/data/")
if [ -z "$REMAINING" ]; then
  echo "✅ No remaining 'mythral' references found!"
else
  echo "⚠ Remaining references:"
  echo "$REMAINING"
fi
