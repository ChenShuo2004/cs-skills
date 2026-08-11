param(
    [string]$Repo = (Get-Location).Path,
    [Parameter(Mandatory = $true)]
    [string]$Checkpoint,
    [switch]$Force,
    [switch]$CleanUntracked
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-GitCapture {
    param(
        [string]$RepoPath,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & git -C $RepoPath @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($exitCode -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $exitCode`: $($output -join "`n")"
    }
    return @($output)
}

function Test-NonEmptyFile {
    param([string]$Path)

    return ((Test-Path -LiteralPath $Path) -and ((Get-Item -LiteralPath $Path).Length -gt 0))
}

if (-not $Force) {
    throw "Restore rewrites the working tree. Re-run with -Force after confirming the checkpoint path."
}

$repoRoot = (Invoke-GitCapture $Repo rev-parse --show-toplevel | Select-Object -First 1).Trim()
$checkpointPath = (Resolve-Path -LiteralPath $Checkpoint).Path
$metadataPath = Join-Path $checkpointPath "metadata.json"
if (-not (Test-Path -LiteralPath $metadataPath)) {
    throw "Missing checkpoint metadata: $metadataPath"
}

$metadata = Get-Content -LiteralPath $metadataPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $metadata.head) {
    throw "Checkpoint metadata does not include a base head."
}

$currentStatus = Invoke-GitCapture $repoRoot status --porcelain=v1
$currentStatus = @($currentStatus | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($currentStatus.Count -gt 0) {
    $createScript = Join-Path $PSScriptRoot "create-checkpoint.ps1"
    if (Test-Path -LiteralPath $createScript) {
        $preRestorePath = & $createScript -Repo $repoRoot -Slug "pre-restore"
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create pre-restore checkpoint."
        }
        Write-Host "Pre-restore checkpoint: $($preRestorePath | Select-Object -Last 1)"
    }
}

Invoke-GitCapture $repoRoot reset --hard $metadata.head | Out-Null

if ($CleanUntracked) {
    Invoke-GitCapture $repoRoot clean "-fd" "-e" ".codex-checkpoints/" | Out-Null
}

$stagedPatch = Join-Path $checkpointPath "staged.patch"
$unstagedPatch = Join-Path $checkpointPath "unstaged.patch"
$untrackedZip = Join-Path $checkpointPath "untracked.zip"

if (Test-NonEmptyFile $stagedPatch) {
    Invoke-GitCapture $repoRoot apply --whitespace=nowarn $stagedPatch | Out-Null
    Invoke-GitCapture $repoRoot apply --cached --whitespace=nowarn $stagedPatch | Out-Null
}

if (Test-NonEmptyFile $unstagedPatch) {
    Invoke-GitCapture $repoRoot apply --whitespace=nowarn $unstagedPatch | Out-Null
}

if (Test-Path -LiteralPath $untrackedZip) {
    Expand-Archive -LiteralPath $untrackedZip -DestinationPath $repoRoot -Force
}

Write-Output "Restored checkpoint: $checkpointPath"
