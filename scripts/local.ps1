param(
    [ValidateSet('dev', 'build', 'start', 'typecheck', 'preview')]
    [string]$Task = 'dev'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtimeDir = Join-Path $projectRoot '.runtime\node-v24.22.1-win-arm64'
$previousPath = $env:PATH
Push-Location $projectRoot
try {
    if (Test-Path -LiteralPath (Join-Path $runtimeDir 'node.exe')) {
        $env:PATH = $runtimeDir + ';' + $env:PATH
    }
    & node scripts/check-node.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Install a supported Node.js version before continuing.' }
    if ($Task -eq 'dev') {
        & npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
    } else {
        & npm.cmd run $Task
    }
    $result = $LASTEXITCODE
} finally {
    $env:PATH = $previousPath
    Pop-Location
}
exit $result
