$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
$archive = Join-Path $root "circle-court-codespace.tar.gz"

if (Test-Path $archive) {
  Remove-Item -LiteralPath $archive
}

Push-Location $root
try {
  tar --exclude "./node_modules" `
      --exclude "./apps/web/.next" `
      --exclude "./packages/contracts/artifacts" `
      --exclude "./packages/contracts/cache" `
      --exclude "./circle-court-codespace.tar.gz" `
      -czf $archive .
  Write-Host "Created $archive"
} finally {
  Pop-Location
}
