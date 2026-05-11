# Automation Test Project Handover

## 1. Project Summary
This repository contains UI automation test scripts built with Playwright for the Vibe project.

Main coverage includes:
- Positive flows: login, create product, add to cart, cart quantity update, checkout (COD/card).
- Negative flows: invalid password, nonexistent user, required field validation.

## 2. Delivered Artifacts
The latest packaged output is available at:
- `deliverable/latest/`

Contents:
- `allure-report/`: Allure HTML report package.
- `playwright-report/`: Playwright HTML report package.
- `json-report.json`: Playwright JSON raw report.
- `junit-report.xml`: JUnit XML report.
- `Automation_Test_Report_Latest.docx`: Client-facing summary report.

## 3. Required Runtime
- Node.js 18+ (recommended 18 or 20 LTS)
- Java 11+ (required by Allure commandline)
- Windows/macOS/Linux terminal access

## 4. Quick Start (Customer)
1. Clone/unzip the project.
2. Install dependencies:
   - `npm install`
3. Run full execution + package deliverable:
   - `npm run test:deliverable`
4. Open Allure report (recommended via local server):
   - `npm run allure:open`

## 5. Key Commands
- Run tests (chromium):
  - `npm run test:chromium`
- Run full report set + package:
  - `npm run test:deliverable`
- Rebuild report package from existing test results:
  - `npm run report:deliverable:allure`
- Generate client DOCX summary report:
  - `npm run report:docx`

## 6. Traceability
Test cases are mapped from:
- `Automation_TestCases_Main.md`
- `Automation_TestCases_Negative.md`

## 7. Support Window (Template)
Please fill before final customer handoff:
- Technical owner:
- Backup owner:
- Support period:
- SLA response time:

## 8. Known Operational Notes
- Opening Allure directly by `file://` may be blocked by browser policy. Use `npm run allure:open`.
- If `Automation_Test_Report_Latest.docx` is open in Word, regeneration updates timestamped report and may skip alias update until file is closed.
