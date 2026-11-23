# TAMO CREATOR - lanzador.
# Enciende el servidor local si no esta corriendo y abre la app en su propia ventana.
# Lo usa el acceso directo del menu Inicio (ver scripts\crear-acceso.ps1).

$ErrorActionPreference = 'SilentlyContinue'
$raiz = Split-Path -Parent $PSScriptRoot
$puerto = 5180
$envFile = Join-Path $raiz '.env'
if (Test-Path $envFile) {
  $m = Select-String -Path $envFile -Pattern '^\s*PUERTO\s*=\s*(\d+)' | Select-Object -First 1
  if ($m) { $puerto = [int]$m.Matches[0].Groups[1].Value }
}
$url = "http://localhost:$puerto"

function Responde {
  # Por IP y no por "localhost": en Windows PowerShell el nombre tarda ~2 s en resolverse y la revision daria falso.
  try { $r = Invoke-WebRequest -Uri "http://127.0.0.1:$puerto/favicon.svg" -UseBasicParsing -TimeoutSec 3; return $r.StatusCode -eq 200 } catch { return $false }
}

if (-not (Responde)) {
  $node = (Get-Command node).Source
  if (-not $node) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show('No se encontro Node.js. Instalalo desde nodejs.org y vuelve a abrir TAMO CREATOR.', 'TAMO CREATOR') | Out-Null
    exit 1
  }
  if (-not (Test-Path (Join-Path $raiz 'node_modules'))) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm install' -WorkingDirectory $raiz -Wait
  }
  Start-Process -FilePath $node -ArgumentList 'server/index.mjs' -WorkingDirectory $raiz -WindowStyle Hidden
  for ($i = 0; $i -lt 60 -and -not (Responde); $i++) { Start-Sleep -Milliseconds 500 }
}

# Ventana propia (sin barra de direcciones) con Edge o Chrome; si no hay, el navegador predeterminado.
$navegadores = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$nav = $navegadores | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if ($nav) { Start-Process -FilePath $nav -ArgumentList "--app=$url" } else { Start-Process $url }
