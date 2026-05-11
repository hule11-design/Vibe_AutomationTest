$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$deliverableDir = Join-Path $root "deliverable/report-$timestamp"
$latestAlias = Join-Path $root 'deliverable/latest'
$latestAllureAlias = Join-Path $root 'allure-report/latest'
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

if (Test-Path (Join-Path $root 'allure-report')) {
  Copy-Item (Join-Path $root 'allure-report') -Destination (Join-Path $deliverableDir 'allure-report') -Recurse -Force
}

$summary = @(
  "Generated At: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "Workspace: $root",
  "Included: playwright-report, junit-report.xml, json-report.json, allure-report"
)
$summary | Set-Content -Path (Join-Path $deliverableDir 'REPORT_SUMMARY.txt')

if (Test-Path $latestAlias) {
  # Remove junction itself without interactive prompts.
  cmd /c rmdir "$latestAlias" | Out-Null
}

New-Item -ItemType Junction -Path $latestAlias -Target $deliverableDir | Out-Null

if (Test-Path $latestAllureAlias) {
  # Remove junction itself without interactive prompts.
  cmd /c rmdir "$latestAllureAlias" | Out-Null
}

New-Item -ItemType Junction -Path $latestAllureAlias -Target (Join-Path $deliverableDir 'allure-report') | Out-Null

Write-Host "Deliverable created at: $deliverableDir"
Write-Host "Latest alias updated at: $latestAlias"
Write-Host "Latest Allure alias updated at: $latestAllureAlias"
