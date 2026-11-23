# TAMO CREATOR · instalación en Windows
#
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1            (solo revisa e instala lo de la app)
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1 -Todo      (además instala las herramientas que falten)
#   powershell -ExecutionPolicy Bypass -File scripts\instalar.ps1 -Skills    (además copia las skills abiertas a tu Claude Code)
#
# No inicia sesión por ti en ningún servicio y no pide ni guarda llaves.

param([switch]$Todo, [switch]$Skills)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

function Existe($nombre) { return [bool](Get-Command $nombre -ErrorAction SilentlyContinue) }
function Linea($ok, $texto) { if ($ok) { Write-Host "  [ok] $texto" -ForegroundColor Green } else { Write-Host "  [--] $texto" -ForegroundColor Yellow } }

Write-Host "`nTAMO CREATOR · revisión del equipo`n" -ForegroundColor Cyan

if (-not (Existe 'node')) {
  Write-Host "Falta Node.js 20 o superior. Instálalo con:  winget install OpenJS.NodeJS.LTS" -ForegroundColor Red
  exit 1
}
$mayor = [int]((node -v) -replace '^v(\d+).*', '$1')
if ($mayor -lt 20) { Write-Host "Tu Node es $(node -v). Se necesita la versión 20 o superior." -ForegroundColor Red; exit 1 }
Linea $true "Node $(node -v)"

$faltan = @()
$herramientas = @(
  @{ cmd = 'git';        nombre = 'Git';          instalar = 'winget install Git.Git';                       necesario = $true  },
  @{ cmd = 'ffmpeg';     nombre = 'FFmpeg';       instalar = 'winget install Gyan.FFmpeg';                   necesario = $true  },
  @{ cmd = 'claude';     nombre = 'Claude Code';  instalar = 'npm install -g @anthropic-ai/claude-code';     necesario = $false },
  @{ cmd = 'codex';      nombre = 'Codex';        instalar = 'npm install -g @openai/codex';                 necesario = $false },
  @{ cmd = 'higgsfield'; nombre = 'Higgsfield';   instalar = 'npm install -g @higgsfield/cli';               necesario = $false },
  @{ cmd = 'hyperframes';nombre = 'Hyperframes';  instalar = 'npm install -g hyperframes';                   necesario = $false }
)
foreach ($h in $herramientas) {
  $ok = Existe $h.cmd
  Linea $ok $h.nombre
  if (-not $ok) { $faltan += $h }
}

Write-Host "`nInstalando dependencias de la app (npm install)…" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install falló." -ForegroundColor Red; exit 1 }

if ($faltan.Count -gt 0) {
  if ($Todo) {
    foreach ($h in $faltan) {
      Write-Host "`nInstalando $($h.nombre)…" -ForegroundColor Cyan
      Invoke-Expression $h.instalar
    }
  } else {
    Write-Host "`nFalta instalar (corre de nuevo con -Todo, o hazlo a mano):" -ForegroundColor Yellow
    foreach ($h in $faltan) { Write-Host "    $($h.instalar)" }
    Write-Host "  Necesitas al menos Claude Code o Codex. Higgsfield solo si vas a usar IA generativa."
  }
}

if ($Skills) {
  $origen = Join-Path $raiz 'skills\vendor'
  $destino = Join-Path $HOME '.claude\skills'
  if (Test-Path $origen) {
    New-Item -ItemType Directory -Force $destino | Out-Null
    $copiadas = 0
    foreach ($s in Get-ChildItem $origen -Directory) {
      $a = Join-Path $destino $s.Name
      if (Test-Path $a) { continue }   # nunca se sobrescribe una skill que ya tienes
      Copy-Item $s.FullName $a -Recurse
      $copiadas++
    }
    Write-Host "`nSkills copiadas a $destino : $copiadas (las que ya tenías no se tocaron)." -ForegroundColor Green
  }
}

Write-Host "`nSiguiente paso, inicia sesión con TUS cuentas (solo la primera vez):" -ForegroundColor Cyan
Write-Host "    claude                  (y dentro: /login)"
Write-Host "    codex                   (si usas Codex)"
Write-Host "    higgsfield auth login   (si usas IA generativa)"
Write-Host "`nPara abrir la app:" -ForegroundColor Cyan
Write-Host "    npm run dev"
Write-Host "  y entra a  http://localhost:5180`n"
