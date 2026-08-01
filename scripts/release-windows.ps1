[CmdletBinding()]
param(
    [string]$Tag = "v1.5.0",
    [string]$Repository = "BISTArk/projman",
    [string]$KeyPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

if (-not $KeyPath) {
    $KeyPath = Join-Path $RepoRoot ".secrets\projman.key"
}
if (-not (Test-Path -LiteralPath $KeyPath -PathType Leaf)) {
    throw "Updater key not found at $KeyPath"
}

$ExpectedVersion = $Tag.TrimStart("v")
$PackageVersion = (Get-Content package.json -Raw | ConvertFrom-Json).version
$TauriVersion = (Get-Content src-tauri\tauri.conf.json -Raw | ConvertFrom-Json).version
if ($PackageVersion -ne $ExpectedVersion -or $TauriVersion -ne $ExpectedVersion) {
    throw "Tag $Tag does not match package.json ($PackageVersion) and tauri.conf.json ($TauriVersion)."
}

gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI is not authenticated. Run 'gh auth login' first."
}

$IsDraft = gh release view $Tag --repo $Repository --json isDraft --jq '.isDraft'
if ($LASTEXITCODE -ne 0 -or $IsDraft.Trim() -ne "true") {
    throw "The $Tag draft release was not found in $Repository."
}

$SecurePassword = Read-Host "Enter the ProjMan updater-key password" -AsSecureString
$PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
try {
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer)
}

$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -LiteralPath $KeyPath -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $Password
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }

    npm run tauri build -- --bundles nsis,msi --config src-tauri/tauri.release.conf.json
    if ($LASTEXITCODE -ne 0) { throw "Windows packaging failed." }
} finally {
    $env:TAURI_SIGNING_PRIVATE_KEY = $null
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $null
    $Password = $null
}

$ArtifactPaths = @(
    (Join-Path $RepoRoot "src-tauri\target\release\bundle\nsis\ProjMan_${ExpectedVersion}_x64-setup.exe"),
    (Join-Path $RepoRoot "src-tauri\target\release\bundle\nsis\ProjMan_${ExpectedVersion}_x64-setup.exe.sig"),
    (Join-Path $RepoRoot "src-tauri\target\release\bundle\msi\ProjMan_${ExpectedVersion}_x64_en-US.msi"),
    (Join-Path $RepoRoot "src-tauri\target\release\bundle\msi\ProjMan_${ExpectedVersion}_x64_en-US.msi.sig")
)
foreach ($ArtifactPath in $ArtifactPaths) {
    if (-not (Test-Path -LiteralPath $ArtifactPath -PathType Leaf)) {
        throw "Expected Windows release artifact was not created: $ArtifactPath"
    }
}

gh release upload $Tag --repo $Repository --clobber $ArtifactPaths
if ($LASTEXITCODE -ne 0) {
    throw "Uploading Windows artifacts failed."
}

Write-Host "Windows $Tag artifacts were signed and uploaded to the draft release." -ForegroundColor Green
