# TAMO CREATOR - crea el acceso directo con logotipo.
# Despues de correrlo, la app aparece al escribir "TAMO CREATOR" en la busqueda de Windows.
#
#   powershell -ExecutionPolicy Bypass -File scripts\crear-acceso.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\crear-acceso.ps1 -Quitar

param([switch]$Quitar, [switch]$SinEscritorio)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$icono = Join-Path $raiz 'public\tamo-creator.ico'
$inicio = Join-Path ([Environment]::GetFolderPath('Programs')) 'TAMO CREATOR.lnk'
$escritorio = Join-Path ([Environment]::GetFolderPath('Desktop')) 'TAMO CREATOR.lnk'

if ($Quitar) {
  foreach ($a in @($inicio, $escritorio)) { if (Test-Path $a) { Remove-Item $a -Confirm:$false; Write-Host "Quitado: $a" } }
  exit 0
}

# --- icono: la T y su barra en ambar sobre carbon, en varios tamanos ---
if (-not (Test-Path $icono)) {
  Add-Type -AssemblyName System.Drawing
  $pngs = @()
  foreach ($t in 16, 24, 32, 48, 64, 128, 256) {
    $bmp = New-Object System.Drawing.Bitmap $t, $t
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(27, 29, 26))
    $ambar = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 183, 0))
    $k = $t / 64.0
    $g.FillRectangle($ambar, [single](14 * $k), [single](11 * $k), [single](36 * $k), [single](6.4 * $k))    # travesano de la T
    $g.FillRectangle($ambar, [single](28.8 * $k), [single](11 * $k), [single](6.4 * $k), [single](31 * $k))  # asta
    $g.FillRectangle($ambar, [single](14 * $k), [single](48 * $k), [single](36 * $k), [single]([Math]::Max(1, 3.3 * $k))) # barra
    $g.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngs += , @($t, $ms.ToArray())
  }
  $fs = [System.IO.File]::Create($icono)
  $w = New-Object System.IO.BinaryWriter $fs
  $w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$pngs.Count)
  $pos = 6 + 16 * $pngs.Count
  foreach ($p in $pngs) {
    $lado = if ($p[0] -ge 256) { 0 } else { $p[0] }
    $w.Write([byte]$lado); $w.Write([byte]$lado); $w.Write([byte]0); $w.Write([byte]0)
    $w.Write([uint16]1); $w.Write([uint16]32); $w.Write([uint32]$p[1].Length); $w.Write([uint32]$pos)
    $pos += $p[1].Length
  }
  foreach ($p in $pngs) { $w.Write([byte[]]$p[1]) }
  $w.Close(); $fs.Close()
  Write-Host "Icono creado: $icono"
}

# --- accesos directos ---
$ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$lanzador = Join-Path $raiz 'scripts\abrir.ps1'
$shell = New-Object -ComObject WScript.Shell
$destinos = @($inicio)
if (-not $SinEscritorio) { $destinos += $escritorio }
foreach ($a in $destinos) {
  $lnk = $shell.CreateShortcut($a)
  $lnk.TargetPath = $ps
  $lnk.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$lanzador`""
  $lnk.WorkingDirectory = $raiz
  $lnk.IconLocation = "$icono,0"
  $lnk.Description = 'TAMO CREATOR: dirige video con tu propia IA'
  $lnk.WindowStyle = 7
  $lnk.Save()
  Write-Host "Acceso creado: $a"
}
Write-Host "`nListo. Presiona la tecla Windows, escribe TAMO CREATOR y aparece con su logotipo."
