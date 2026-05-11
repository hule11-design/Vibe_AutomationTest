# Troubleshooting Guide

## 1. Allure page stuck at "Loading..."
Symptoms:
- Report opens but widgets keep showing "Loading..."

Actions:
1. Regenerate report package:
   - `npm run report:deliverable:allure`
2. Open using local server (not direct file open):
   - `npm run allure:open`
3. Hard refresh browser (Ctrl+F5) if needed.

## 2. Customer cannot open local hyperlink in DOCX
Reason:
- Local absolute paths point to developer machine.

Action:
- Use command-based instructions in `Automation_Test_Report_Latest.docx`.
- Regenerate reports locally using this repo commands.

## 3. `EBUSY` when generating DOCX
Symptoms:
- Error writing `Automation_Test_Report_Latest.docx`

Reason:
- File is open in Microsoft Word.

Actions:
1. Close the DOCX file.
2. Run:
   - `npm run report:docx`

## 4. `java` command not found
Reason:
- Java is missing or not in PATH.

Actions:
1. Install Java 11+.
2. Reopen terminal.
3. Verify:
   - `java -version`

## 5. Playwright browser launch issues
Actions:
1. Reinstall browsers:
   - `npx playwright install`
2. Retry tests:
   - `npm run test:chromium`

## 6. Report mismatch with latest execution
Actions:
1. Run fresh full flow:
   - `npm run test:deliverable`
2. Re-open report:
   - `npm run allure:open`
3. Validate packaged output in:
   - `deliverable/latest/`

## 7. Dependency install errors
Actions:
1. Remove local modules and lock reinstall:
   - Delete `node_modules/`
   - `npm ci` (if lockfile trusted) or `npm install`
2. Retry command.
