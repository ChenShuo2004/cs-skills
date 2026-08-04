Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$skillRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$createScript = Join-Path $skillRoot "scripts\create-checkpoint.ps1"
$restoreScript = Join-Path $skillRoot "scripts\restore-checkpoint.ps1"

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )
    if (-not $Condition) {
        throw $Message
    }
}

function Assert-FileContains {
    param(
        [string]$Path,
        [string]$Text
    )
    Assert-True (Test-Path -LiteralPath $Path) "Missing file: $Path"
    $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    Assert-True ($content.Contains($Text)) "Expected '$Path' to contain '$Text'"
}

function Invoke-Git {
    param(
        [string]$Repo,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )
    & git -C $Repo @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("checkpoint-version-test-" + [guid]::NewGuid().ToString("N"))
$repo = Join-Path $testRoot "repo"
$checkpointRoot = Join-Path $testRoot "checkpoints"

try {
    New-Item -ItemType Directory -Path $repo -Force | Out-Null
    New-Item -ItemType Directory -Path $checkpointRoot -Force | Out-Null

    Invoke-Git $repo init
    Invoke-Git $repo config user.email "test@example.invalid"
    Invoke-Git $repo config user.name "Checkpoint Test"

    Set-Content -LiteralPath (Join-Path $repo "tracked.txt") -Value "base tracked" -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $repo "staged.txt") -Value "base staged" -Encoding UTF8
    Invoke-Git $repo add tracked.txt staged.txt
    Invoke-Git $repo commit -m "base"

    Set-Content -LiteralPath (Join-Path $repo "tracked.txt") -Value "dirty tracked" -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $repo "staged.txt") -Value "checkpoint staged" -Encoding UTF8
    Invoke-Git $repo add staged.txt
    New-Item -ItemType Directory -Path (Join-Path $repo "notes") -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $repo "notes\untracked.txt") -Value "checkpoint untracked" -Encoding UTF8

    $checkpointPath = & $createScript -Repo $repo -Slug "unit-test" -OutputRoot $checkpointRoot
    if ($LASTEXITCODE -ne 0) {
        throw "create-checkpoint.ps1 failed with exit code $LASTEXITCODE"
    }
    $checkpointPath = ($checkpointPath | Select-Object -Last 1).Trim()

    Assert-True (Test-Path -LiteralPath $checkpointPath) "Checkpoint directory was not created"
    Assert-True (Test-Path -LiteralPath (Join-Path $checkpointPath "metadata.json")) "metadata.json missing"
    Assert-True (Test-Path -LiteralPath (Join-Path $checkpointPath "staged.patch")) "staged.patch missing"
    Assert-True (Test-Path -LiteralPath (Join-Path $checkpointPath "unstaged.patch")) "unstaged.patch missing"
    Assert-True (Test-Path -LiteralPath (Join-Path $checkpointPath "untracked.zip")) "untracked.zip missing"
    Assert-FileContains (Join-Path $checkpointPath "status-porcelain.txt") "M  staged.txt"
    Assert-FileContains (Join-Path $checkpointPath "status-porcelain.txt") " M tracked.txt"
    Assert-FileContains (Join-Path $checkpointPath "status-porcelain.txt") "?? notes/untracked.txt"
    Assert-FileContains (Join-Path $checkpointPath "staged.patch") "checkpoint staged"
    Assert-FileContains (Join-Path $checkpointPath "unstaged.patch") "dirty tracked"
    Assert-FileContains (Join-Path $checkpointPath "untracked-files.txt") "notes/untracked.txt"

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path $checkpointPath "untracked.zip"))
    try {
        $entryNames = @($zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") })
        Assert-True ($entryNames -contains "notes/untracked.txt") "untracked.zip did not preserve relative path"
    }
    finally {
        $zip.Dispose()
    }

    Set-Content -LiteralPath (Join-Path $repo "tracked.txt") -Value "after checkpoint" -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $repo "staged.txt") -Value "after staged" -Encoding UTF8
    Remove-Item -LiteralPath (Join-Path $repo "notes\untracked.txt") -Force
    Set-Content -LiteralPath (Join-Path $repo "later.txt") -Value "remove me on clean restore" -Encoding UTF8

    & $restoreScript -Repo $repo -Checkpoint $checkpointPath -Force -CleanUntracked
    if ($LASTEXITCODE -ne 0) {
        throw "restore-checkpoint.ps1 failed with exit code $LASTEXITCODE"
    }

    Assert-FileContains (Join-Path $repo "tracked.txt") "dirty tracked"
    Assert-FileContains (Join-Path $repo "staged.txt") "checkpoint staged"
    Assert-FileContains (Join-Path $repo "notes\untracked.txt") "checkpoint untracked"
    Assert-True (-not (Test-Path -LiteralPath (Join-Path $repo "later.txt"))) "Clean restore should remove later untracked files"

    $cachedDiff = & git -C $repo diff --cached -- staged.txt
    Assert-True (($cachedDiff -join "`n").Contains("checkpoint staged")) "staged diff was not restored"
    $worktreeDiff = & git -C $repo diff -- tracked.txt
    Assert-True (($worktreeDiff -join "`n").Contains("dirty tracked")) "unstaged diff was not restored"

    "checkpoint-version tests passed"
}
finally {
    if (Test-Path -LiteralPath $testRoot) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}
