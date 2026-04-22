$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$deliverableDir = Join-Path $root "deliverable/report-$timestamp"
New-Item -ItemType Directory -Path $deliverableDir -Force | Out-Null

if (Test-Path (Join-Path $root 'playwright-report')) {
  Copy-Item (Join-Path $root 'playwright-report') -Destination (Join-Path $deliverableDir 'playwright-report') -Recurse -Force
}

if (Test-Path (Join-Path $root 'test-results/junit-report.xml')) {
  Copy-Item (Join-Path $root 'test-results/junit-report.xml') -Destination (Join-Path $deliverableDir 'junit-report.xml') -Force
}

if (Test-Path (Join-Path $root 'test-results/json-report.json')) {
  Copy-Item (Join-Path $root 'test-results/json-report.json') -Destination (Join-Path $deliverableDir 'json-report.json') -Force
}

$summary = @(
  "Generated At: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "Workspace: $root",
  "Included: playwright-report, junit-report.xml, json-report.json"
)
$summary | Set-Content -Path (Join-Path $deliverableDir 'REPORT_SUMMARY.txt')

Write-Host "Deliverable created at: $deliverableDir"
