# Environment Setup Guide

## 1. Prerequisites
- Node.js 18+
- Java 11+
- Git (optional but recommended)

Verify installations:
- `node -v`
- `npm -v`
- `java -version`

## 2. Install Project Dependencies
From repository root:
- `npm install`

## 3. Browser Dependencies
Install Playwright browsers (first-time setup):
- `npx playwright install`

If needed (Linux CI):
- `npx playwright install --with-deps`

## 4. Configuration
Environment sample file:
- `.env.shopper.example`

Recommended process:
1. Copy `.env.shopper.example` to `.env` (or your environment-specific file).
2. Update base URL and credentials for the target environment.
3. Keep secrets out of git.

## 5. Run Modes
- Basic run:
  - `npm run test`
- Chromium only:
  - `npm run test:chromium`
- Full run with packaged reports:
  - `npm run test:deliverable`

## 6. Report Generation
- Generate deliverable + Allure from existing outputs:
  - `npm run report:deliverable:allure`
- Open Allure report:
  - `npm run allure:open`
- Generate DOCX client report:
  - `npm run report:docx`

## 7. Output Locations
- Raw test output: `test-results/`
- Allure result model: `allure-results/`
- Generated Allure HTML: `allure-report/`
- Packaged handover artifacts: `deliverable/latest/`
