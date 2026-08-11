param(
    [string]$Repo = (Get-Location).Path,
    [string]$Slug = "checkpoint",
    [string]$OutputRoot
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

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string[]]$Lines
    )

    $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
    $lineArray = @()
    if ($null -ne $Lines) {
        $lineArray = @($Lines)
    }
    $text = ""
    if ($lineArray.Count -gt 0) {
        $text = [string]::Join("`n", $lineArray) + "`n"
    }
    [System.IO.File]::WriteAllText($Path, $text, $encoding)
}

function ConvertTo-SafeSlug {
    param([string]$Value)

    $safe = $Value.Trim().ToLowerInvariant() -replace "[^a-z0-9._-]+", "-"
    $safe = $safe.Trim("-")
    if ([string]::IsNullOrWhiteSpace($safe)) {
        return "checkpoint"
    }
    return $safe
}

$repoRoot = (Invoke-GitCapture $Repo rev-parse --show-toplevel | Select-Object -First 1).Trim()
if (-not $OutputRoot) {
    $OutputRoot = Join-Path $repoRoot ".codex-checkpoints"
}

$safeSlug = ConvertTo-SafeSlug $Slug
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$checkpointPath = Join-Path $OutputRoot "$timestamp-$safeSlug"

New-Item -ItemType Directory -Path $checkpointPath -Force | Out-Null

$branch = (Invoke-GitCapture $repoRoot rev-parse --abbrev-ref HEAD | Select-Object -First 1).Trim()
$head = (Invoke-GitCapture $repoRoot rev-parse HEAD | Select-Object -First 1).Trim()
$headShort = (Invoke-GitCapture $repoRoot rev-parse --short HEAD | Select-Object -First 1).Trim()
$statusPorcelain = Invoke-GitCapture $repoRoot status --porcelain=v1 --untracked-files=all
$statusLong = Invoke-GitCapture $repoRoot status --short --branch
$stagedPatch = Invoke-GitCapture $repoRoot diff --binary --cached --
$unstagedPatch = Invoke-GitCapture $repoRoot diff --binary --
$untrackedFiles = Invoke-GitCapture $repoRoot ls-files --others --exclude-standard
$untrackedFiles = @($untrackedFiles | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

Write-Utf8NoBom (Join-Path $checkpointPath "status.txt") $statusLong
Write-Utf8NoBom (Join-Path $checkpointPath "status-porcelain.txt") $statusPorcelain
Write-Utf8NoBom (Join-Path $checkpointPath "staged.patch") $stagedPatch
Write-Utf8NoBom (Join-Path $checkpointPath "unstaged.patch") $unstagedPatch
Write-Utf8NoBom (Join-Path $checkpointPath "untracked-files.txt") $untrackedFiles

$untrackedZip = Join-Path $checkpointPath "untracked.zip"
if ($untrackedFiles.Count -gt 0) {
    $stageRoot = Join-Path $checkpointPath ".untracked-stage"
    New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
    try {
        foreach ($relativePath in $untrackedFiles) {
            $localRelativePath = $relativePath -replace "/", [System.IO.Path]::DirectorySeparatorChar
            $sourcePath = Join-Path $repoRoot $localRelativePath
            if (-not (Test-Path -LiteralPath $sourcePath)) {
                continue
            }
            $targetPath = Join-Path $stageRoot $localRelativePath
            $targetParent = Split-Path -Parent $targetPath
            New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
            Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
        }

        Add-Type -AssemblyName System.IO.Compression.FileSystem
        if (Test-Path -LiteralPath $untrackedZip) {
            Remove-Item -LiteralPath $untrackedZip -Force
        }
        [System.IO.Compression.ZipFile]::CreateFromDirectory($stageRoot, $untrackedZip)
    }
    finally {
        if (Test-Path -LiteralPath $stageRoot) {
            Remove-Item -LiteralPath $stageRoot -Recurse -Force
        }
    }
}

$metadata = [ordered]@{
    schema_version = 1
    created_at = (Get-Date).ToString("o")
    repo_root = $repoRoot
    branch = $branch
    head = $head
    head_short = $headShort
    slug = $safeSlug
    status_entries = $statusPorcelain.Count
    staged_patch = "staged.patch"
    unstaged_patch = "unstaged.patch"
    untracked_files = $untrackedFiles.Count
    untracked_archive = $(if (Test-Path -LiteralPath $untrackedZip) { "untracked.zip" } else { $null })
    restore_hint = "scripts/restore-checkpoint.ps1 -Repo <repo> -Checkpoint <checkpoint-path> -Force"
}

$metadataJson = $metadata | ConvertTo-Json -Depth 5
Write-Utf8NoBom (Join-Path $checkpointPath "metadata.json") @($metadataJson)

Write-Output $checkpointPath
