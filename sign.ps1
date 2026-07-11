param()

$KeyPath = "C:\Users\Admin\Documents\projman\~\.tauri\projman.key"
$ExeBundle = "src-tauri\target\release\bundle\nsis"
$MsiBundle = "src-tauri\target\release\bundle\msi"

# Read key content directly (avoids path-with-colon issues in -k flag)
$KeyContent = Get-Content $KeyPath -Raw

# Prompt for password
Write-Host ""
$SecurePassword = Read-Host "Enter signing key password (press Enter for no password)" -AsSecureString
$Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Signing ProjMan installers..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

function Sign-File($filePath) {
    $env:TAURI_SIGNING_PRIVATE_KEY = $KeyContent
    if ($Password -ne "") {
        $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $Password
    } else {
        $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
    }
    npx tauri signer sign $filePath
    $env:TAURI_SIGNING_PRIVATE_KEY = $null
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $null
}

# Sign .exe files
$exeFiles = Get-ChildItem $ExeBundle -Filter "*.exe" -ErrorAction SilentlyContinue
if ($exeFiles) {
    foreach ($file in $exeFiles) {
        Write-Host ""
        Write-Host "--- Signing .exe: $($file.Name)" -ForegroundColor Green
        Sign-File $file.FullName
    }
} else {
    Write-Host "No .exe files found in $ExeBundle" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Signing .msi installer..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Sign .msi files
$msiFiles = Get-ChildItem $MsiBundle -Filter "*.msi" -ErrorAction SilentlyContinue
if ($msiFiles) {
    foreach ($file in $msiFiles) {
        Write-Host ""
        Write-Host "--- Signing .msi: $($file.Name)" -ForegroundColor Green
        Sign-File $file.FullName
    }
} else {
    Write-Host "No .msi files found in $MsiBundle" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done! Paste the signatures above into update.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
