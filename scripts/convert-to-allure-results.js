// Convert Playwright JSON report → Allure 2 results format
// Allure 2 format: one JSON file per test result in allure-results/
// Each file is named: <uuid>-result.json
// Also writes allure-results/environment.properties for suite metadata

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Paths ───────────────────────────────────────────────────────────────────
const ROOT_DIR = path.join(__dirname, '..');
const REPORT_DIR = process.argv[2] || 'deliverable/report-20260506-100925';
const JSON_REPORT = path.join(REPORT_DIR, 'json-report.json');
const OUT_DIR = path.join(ROOT_DIR, 'allure-results');

if (!fs.existsSync(JSON_REPORT)) {
  console.error(`❌  Cannot find: ${JSON_REPORT}`);
  console.error(`   Usage: node scripts/convert-to-allure-results.js [path/to/report-dir]`);
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uuid() {
  return crypto.randomUUID();
}

function historyId(fullName) {
  return crypto.createHash('md5').update(fullName).digest('hex');
}

function sanitizeFileExtension(filePath, contentType) {
  const ext = path.extname(filePath || '');
  if (ext) return ext;

  const byContentType = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'video/webm': '.webm',
    'text/plain': '.txt',
    'text/markdown': '.md',
    'application/zip': '.zip',
  };

  return byContentType[contentType] || '.bin';
}

function restoreHistoryFromPreviousReport() {
  const historyCandidates = [
    path.join(ROOT_DIR, 'allure-report', 'history'),
    path.join(ROOT_DIR, 'deliverable', 'latest', 'allure-report', 'history')
  ];

  const existingHistory = historyCandidates.find(candidate => fs.existsSync(candidate));
  if (!existingHistory) {
    return false;
  }

  const outHistory = path.join(OUT_DIR, 'history');
  fs.mkdirSync(outHistory, { recursive: true });
  fs.cpSync(existingHistory, outHistory, { recursive: true, force: true });
  return true;
}

// Map Playwright status → Allure status
function mapStatus(status, expectedStatus) {
  if (status === 'passed') return 'passed';
  if (status === 'skipped') return 'skipped';
  if (status === 'failed' || status === 'timedOut') {
    // expectedStatus='failed' means it's an expected failure → "broken" in Allure
    return expectedStatus === 'failed' ? 'broken' : 'failed';
  }
  return 'unknown';
}

// Parse suite hierarchy and collect all test records flat
function extractTests(suites, suitePath = [], results = []) {
  for (const suite of suites) {
    const current = [...suitePath, suite.title].filter(Boolean);
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          results.push({
            suitePath: current,
            specTitle: spec.title,
            specFile: spec.file,
            specId: spec.id,
            test
          });
        }
      }
    }
    if (suite.suites) {
      extractTests(suite.suites, current, results);
    }
  }
  return results;
}

// Copy a single Playwright attachment into allure-results and return the Allure reference.
function convertAttachments(attachments = []) {
  return attachments.flatMap(attachment => {
    const attachmentPath = attachment.path || '';
    if (!attachmentPath || !fs.existsSync(attachmentPath)) return [];

    const extension = sanitizeFileExtension(attachmentPath, attachment.contentType);
    const source = `${uuid()}-attachment${extension}`;
    fs.copyFileSync(attachmentPath, path.join(OUT_DIR, source));

    return [{
      name: attachment.name || 'attachment',
      source,
      type: attachment.contentType || 'text/plain'
    }];
  });
}

// Build labels array for Allure metadata side-panel
function buildLabels(suitePath, projectName) {
  const labels = [
    { name: 'framework', value: 'Playwright' },
    { name: 'language', value: 'TypeScript' },
    { name: 'host', value: projectName || 'chromium' },
  ];

  // Allure uses 'suite', 'parentSuite', 'subSuite' for the 3 levels
  if (suitePath[0]) labels.push({ name: 'parentSuite', value: suitePath[0] });
  if (suitePath[1]) labels.push({ name: 'suite', value: suitePath[1] });
  if (suitePath[2]) labels.push({ name: 'subSuite', value: suitePath[2] });

  return labels;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const report = JSON.parse(fs.readFileSync(JSON_REPORT, 'utf8'));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
// Clean previous results
fs.readdirSync(OUT_DIR).forEach(f => fs.rmSync(path.join(OUT_DIR, f), { recursive: true, force: true }));
const historyRestored = restoreHistoryFromPreviousReport();

const allTestRecords = extractTests(report.suites);
let written = 0;

for (const record of allTestRecords) {
  const { suitePath, specTitle, specFile, test } = record;

  for (const result of test.results) {
    const startMs = new Date(result.startTime).getTime();
    const stopMs = startMs + result.duration;
    const fullName = `${specFile} > ${specTitle}`;
    const status = mapStatus(result.status, test.expectedStatus);

    const allureResult = {
      uuid: uuid(),
      historyId: historyId(fullName + (result.retry > 0 ? `_retry${result.retry}` : '')),
      name: specTitle,
      fullName,
      status,
      stage: 'finished',
      start: startMs,
      stop: stopMs,
      description: suitePath.join(' › '),
      labels: buildLabels(suitePath, test.projectName),
      links: [],
      parameters: [
        { name: 'project', value: test.projectName || 'chromium' },
        ...(result.retry > 0 ? [{ name: 'retry', value: String(result.retry) }] : [])
      ],
      attachments: convertAttachments(result.attachments),
      // Steps: Playwright doesn't emit step-level data in JSON report
      steps: [],
    };

    // Add failure detail when test failed
    if (status === 'failed' || status === 'broken') {
      const err = result.errors?.[0];
      if (err) {
        allureResult.statusDetails = {
          message: err.message?.replace(/\x1B\[[0-9;]*m/g, '') || 'Test failed',
          trace: err.stack?.replace(/\x1B\[[0-9;]*m/g, '') || ''
        };
      }
    }

    const outFile = path.join(OUT_DIR, `${allureResult.uuid}-result.json`);
    fs.writeFileSync(outFile, JSON.stringify(allureResult, null, 2));
    written++;
  }
}

// Write environment.properties so Allure shows env info
const stats = report.stats || {};
const envProps = [
  `Browser=Chromium`,
  `Framework=Playwright ${report.config?.version || ''}`.trim(),
  `Language=TypeScript`,
  `BaseURL=${report.config?.projects?.[0]?.use?.baseURL || ''}`,
  `Total=${stats.expected || written}`,
  `Passed=${stats.ok || ''}`,
  `StartTime=${stats.startTime || ''}`,
].join('\n');
fs.writeFileSync(path.join(OUT_DIR, 'environment.properties'), envProps);

// Write executor.json so Allure can correlate builds and render trend over time
const buildOrder = Number(new Date(stats.startTime || Date.now()).getTime()) || Date.now();
const executor = {
  name: 'Local Playwright Run',
  type: 'local',
  buildName: `run-${buildOrder}`,
  buildOrder,
  reportName: 'Allure Report'
};
fs.writeFileSync(path.join(OUT_DIR, 'executor.json'), JSON.stringify(executor, null, 2));

// Write categories.json so Allure can bucket failures nicely
const categories = [
  {
    name: 'Connection errors',
    messageRegex: '.*ERR_CONNECTION.*|.*net::.*',
    matchedStatuses: ['failed', 'broken']
  },
  {
    name: 'Timeout errors',
    messageRegex: '.*Timeout.*|.*timeout.*',
    matchedStatuses: ['failed', 'broken']
  },
  {
    name: 'Assertion errors',
    messageRegex: '.*expect\\(.*',
    matchedStatuses: ['failed']
  }
];

const hasCategoryData = allTestRecords.some(({ test }) =>
  (test.results || []).some(result => {
    const status = mapStatus(result.status, test.expectedStatus);
    const message = result.errors?.[0]?.message || '';
    if (!message) return false;

    return categories.some(category => {
      const matchedStatuses = category.matchedStatuses || [];
      if (!matchedStatuses.includes(status)) return false;
      return new RegExp(category.messageRegex).test(message);
    });
  })
);

if (hasCategoryData) {
  fs.writeFileSync(
    path.join(OUT_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
}

console.log(`✅  Converted ${written} test result(s) → ${OUT_DIR}`);
console.log(`📄  environment.properties written`);
console.log(`👷  executor.json written`);
if (historyRestored) {
  console.log(`📈  history restored for Trend`);
} else {
  console.log(`📈  no previous history found (Trend starts from this run)`);
}
console.log(hasCategoryData ? `🏷️   categories.json written` : `🏷️   categories.json skipped (no matched category data)`);
console.log(`\nNext: npm run allure:generate  →  npm run allure:open`);
