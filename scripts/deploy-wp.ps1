# Copia el viewer y el bridge a la carpeta uploads de WordPress
# Ajusta estas rutas a tu entorno local/servidor
param(
  [string]$WpUploads = "C:\Users\YOU\Local Sites\blind\app\public\wp-content\uploads\g3d",
  [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"
$bridgeSrc = Join-Path $RepoRoot "apps\viewer\bridge\g3d-bridge.js"
$viewerDist = Join-Path $RepoRoot "apps\viewer\dist"

if (!(Test-Path $WpUploads)) { New-Item -ItemType Directory -Path $WpUploads | Out-Null }
Copy-Item $bridgeSrc (Join-Path $WpUploads "g3d-bridge.js") -Force
if (!(Test-Path (Join-Path $WpUploads "viewer"))) { New-Item -ItemType Directory -Path (Join-Path $WpUploads "viewer") | Out-Null }
Copy-Item (Join-Path $viewerDist "index.html") (Join-Path $WpUploads "viewer\index.html") -Force

Write-Host "✅ Bridge y viewer copiados en $WpUploads"
