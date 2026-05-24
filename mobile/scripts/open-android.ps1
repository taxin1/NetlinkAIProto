# Opens the Netlink Android project in Android Studio, or guides you if Studio is missing.
$ErrorActionPreference = "Stop"

$candidates = @(
  "$env:ProgramFiles\Android\Android Studio\bin\studio64.exe",
  "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
  "$env:LOCALAPPDATA\Programs\Android Studio\bin\studio64.exe",
  "$env:USERPROFILE\AppData\Local\Programs\Android Studio\bin\studio64.exe"
)

if ($env:CAPACITOR_ANDROID_STUDIO_PATH -and (Test-Path $env:CAPACITOR_ANDROID_STUDIO_PATH)) {
  $studio = $env:CAPACITOR_ANDROID_STUDIO_PATH
} else {
  $studio = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

$androidDir = Join-Path $PSScriptRoot "..\android" | Resolve-Path

if ($studio) {
  Write-Host "Found Android Studio: $studio" -ForegroundColor Green
  $env:CAPACITOR_ANDROID_STUDIO_PATH = $studio
  Set-Location (Join-Path $PSScriptRoot "..")
  npx cap open android
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Android Studio is not installed (or not in a standard location)." -ForegroundColor Yellow
Write-Host ""
Write-Host "Do this:" -ForegroundColor Cyan
Write-Host "  1. Download: https://developer.android.com/studio"
Write-Host "  2. Install with default options (includes Android SDK)"
Write-Host "  3. Run again:  npm run open:android"
Write-Host ""
Write-Host "Or open the project manually after installing:" -ForegroundColor Cyan
Write-Host "  Android Studio -> File -> Open ->"
Write-Host "  $androidDir"
Write-Host ""

# Open folder so user can File -> Open in Studio after install
if (Test-Path $androidDir) {
  explorer.exe $androidDir
}

exit 1
