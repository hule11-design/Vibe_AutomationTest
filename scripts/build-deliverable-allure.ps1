$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$jsonReport = Join-Path $root 'test-results/json-report.json'

if (-not (Test-Path $jsonReport)) {
  throw "Cannot find latest Playwright JSON report at: $jsonReport"
}

Write-Host "Rebuilding allure-results from: $jsonReport"
node (Join-Path $root 'scripts/convert-to-allure-results.js') 'test-results'

Write-Host "Generating allure-report"
npx allure generate allure-results -o allure-report --clean

Write-Host "Post-processing allure-report"
node (Join-Path $root 'scripts/postprocess-allure-report.js') 'allure-report' 'allure-results'

Write-Host "Packaging deliverable"
& (Join-Path $PSScriptRoot 'package-reports.ps1')

Write-Host "Generating client DOCX report"
node (Join-Path $root 'scripts/generate-client-docx-report.js')