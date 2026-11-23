#!/usr/bin/env bash
# TAMO CREATOR · instalación en macOS y Linux
#   bash scripts/instalar.sh            revisa e instala lo de la app
#   bash scripts/instalar.sh --todo     además instala las herramientas de npm que falten
#   bash scripts/instalar.sh --skills   además copia las skills abiertas a ~/.claude/skills
set -euo pipefail
cd "$(dirname "$0")/.."

TODO=0; SKILLS=0
for a in "$@"; do [ "$a" = "--todo" ] && TODO=1; [ "$a" = "--skills" ] && SKILLS=1; done

command -v node >/dev/null || { echo "Falta Node.js 20 o superior: https://nodejs.org"; exit 1; }
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || { echo "Se necesita Node 20 o superior (tienes $(node -v))."; exit 1; }
echo "[ok] Node $(node -v)"

faltan=()
revisa() { if command -v "$1" >/dev/null; then echo "[ok] $2"; else echo "[--] $2"; faltan+=("$3"); fi; }
revisa git "Git" "instala Git con el gestor de paquetes de tu sistema"
revisa ffmpeg "FFmpeg" "brew install ffmpeg   (o: sudo apt install ffmpeg)"
revisa claude "Claude Code" "npm install -g @anthropic-ai/claude-code"
revisa codex "Codex" "npm install -g @openai/codex"
revisa higgsfield "Higgsfield" "npm install -g @higgsfield/cli"
revisa hyperframes "Hyperframes" "npm install -g hyperframes"

npm install

if [ ${#faltan[@]} -gt 0 ]; then
  echo; echo "Falta instalar:"
  for f in "${faltan[@]}"; do
    echo "    $f"
    if [ $TODO -eq 1 ] && [[ "$f" == npm\ install* ]]; then $f; fi
  done
fi

if [ $SKILLS -eq 1 ] && [ -d skills/vendor ]; then
  mkdir -p "$HOME/.claude/skills"
  for s in skills/vendor/*/; do
    n=$(basename "$s"); [ -e "$HOME/.claude/skills/$n" ] || cp -R "$s" "$HOME/.claude/skills/$n"
  done
  echo "Skills copiadas a ~/.claude/skills (las que ya tenías no se tocaron)."
fi

echo; echo "Inicia sesión con TUS cuentas:  claude  ·  codex  ·  higgsfield auth login"
echo "Abre la app:  npm run dev   →  http://localhost:5180"
