const fs = require('fs');
const path = require('path');
const {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function pct(numerator, denominator) {
  if (!denominator) return '0.00%';
  return `${((numerator / denominator) * 100).toFixed(2)}%`;
}

function envValue(environment, key) {
  const found = environment.find(item => item.name === key);
  if (!found || !Array.isArray(found.values) || found.values.length === 0) return 'N/A';
  return found.values[0] || 'N/A';
}

async function main() {
  const root = process.cwd();
  const latestAllureDir = path.join(root, 'allure-report', 'latest');
  const widgetsDir = path.join(latestAllureDir, 'widgets');

  if (!fs.existsSync(widgetsDir)) {
    throw new Error(`Cannot find Allure widgets at: ${widgetsDir}`);
  }

  const summary = readJson(path.join(widgetsDir, 'summary.json'), {
    statistic: { total: 0, passed: 0, failed: 0, broken: 0, skipped: 0, unknown: 0 },
    time: { duration: 0, start: 0, stop: 0 },
  });
  const suites = readJson(path.join(widgetsDir, 'suites.json'), { total: 0, items: [] });
  const categories = readJson(path.join(widgetsDir, 'categories.json'), { total: 0, items: [] });
  const environment = readJson(path.join(widgetsDir, 'environment.json'), []);

  const stat = summary.statistic || {};
  const total = stat.total || 0;
  const passed = stat.passed || 0;
  const failed = stat.failed || 0;
  const broken = stat.broken || 0;
  const skipped = stat.skipped || 0;
  const unknown = stat.unknown || 0;

  const runDate = new Date(summary.time?.start || Date.now());
  const runDateText = runDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const durationSec = ((summary.time?.duration || 0) / 1000).toFixed(2);

  const browser = envValue(environment, 'Browser');
  const framework = envValue(environment, 'Framework');
  const language = envValue(environment, 'Language');

  const suiteRows = (suites.items || []).slice(0, 20).map(item => {
    const s = item.statistic || {};
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(item.name || 'N/A')] }),
        new TableCell({ children: [new Paragraph(String(s.total || 0))] }),
        new TableCell({ children: [new Paragraph(String(s.passed || 0))] }),
        new TableCell({ children: [new Paragraph(String((s.failed || 0) + (s.broken || 0)))] }),
      ],
    });
  });

  const categoryRows = (categories.items || []).map(item =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(item.name || 'N/A')] }),
        new TableCell({ children: [new Paragraph(String(item.statistic?.total || 0))] }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun('Automation Test Execution Report')],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun(`Client Version - Generated on ${runDateText}`)],
          }),
          new Paragraph(''),

          new Paragraph({ heading: HeadingLevel.HEADING_1, text: '1. Executive Summary' }),
          new Paragraph(
            `The latest automated regression execution completed successfully with ${passed} passed tests out of ${total} total test cases (${pct(passed, total)} pass rate).`
          ),
          new Paragraph(
            `No blocking defects were detected in this run. Failed/Broken test count: ${failed + broken}. Skipped test count: ${skipped}.`
          ),

          new Paragraph({ heading: HeadingLevel.HEADING_1, text: '2. Execution Snapshot' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Execution Date (UTC)')] }),
                  new TableCell({ children: [new Paragraph(runDateText)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Execution Duration')] }),
                  new TableCell({ children: [new Paragraph(`${durationSec} seconds`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Browser')] }),
                  new TableCell({ children: [new Paragraph(browser)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Framework')] }),
                  new TableCell({ children: [new Paragraph(framework)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Language')] }),
                  new TableCell({ children: [new Paragraph(language)] }),
                ],
              }),
            ],
          }),

          new Paragraph({ heading: HeadingLevel.HEADING_1, text: '3. Result Summary' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Metric')] }),
                  new TableCell({ children: [new Paragraph('Value')] }),
                ],
              }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Total')] }), new TableCell({ children: [new Paragraph(String(total))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Passed')] }), new TableCell({ children: [new Paragraph(String(passed))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Failed')] }), new TableCell({ children: [new Paragraph(String(failed))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Broken')] }), new TableCell({ children: [new Paragraph(String(broken))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Skipped')] }), new TableCell({ children: [new Paragraph(String(skipped))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Unknown')] }), new TableCell({ children: [new Paragraph(String(unknown))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Pass Rate')] }), new TableCell({ children: [new Paragraph(pct(passed, total))] })] }),
            ],
          }),

          new Paragraph({ heading: HeadingLevel.HEADING_1, text: '4. Test Suite Coverage (Top Items)' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Suite')] }),
                  new TableCell({ children: [new Paragraph('Total')] }),
                  new TableCell({ children: [new Paragraph('Passed')] }),
                  new TableCell({ children: [new Paragraph('Failed/Broken')] }),
                ],
              }),
              ...suiteRows,
            ],
          }),

          new Paragraph({ heading: HeadingLevel.HEADING_1, text: '5. Defect/Error Category Overview' }),
          categoryRows.length > 0
            ? new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph('Category')] }),
                      new TableCell({ children: [new Paragraph('Count')] }),
                    ],
                  }),
                  ...categoryRows,
                ],
              })
            : new Paragraph('No failed/broken categories were recorded in the latest execution.'),

          new Paragraph({ heading: HeadingLevel.HEADING_1, text: '6. Client Reproduction Guide (Allure Report)' }),
          new Paragraph('To generate and review the Allure report on your own machine, please follow the steps below:'),
          new Paragraph('Step 1 - Prerequisites: Install Node.js 18+ and Java 11+.'),
          new Paragraph('Step 2 - Open terminal in project root folder and install dependencies: npm install'),
          new Paragraph('Step 3 - Run automation test execution and package artifacts: npm run test:deliverable'),
          new Paragraph('Step 4 - If you only need to regenerate report from existing results: npm run report:deliverable:allure'),
          new Paragraph('Step 5 - Open Allure report via local web server (recommended): npm run allure:open'),
          new Paragraph('Step 6 - Output locations after execution:'),
          new Paragraph('  - Latest packaged artifacts: deliverable/latest'),
          new Paragraph('  - Latest Allure report folder: allure-report/latest'),
          new Paragraph('Note: Opening index.html directly from file explorer may be restricted by browser security policies. Use npm run allure:open for reliable viewing.'),

          new Paragraph({ heading: HeadingLevel.HEADING_1, text: '7. Client Notes & Recommendation' }),
          new Paragraph(
            'The current automation baseline is stable for the covered scenarios. We recommend continuing scheduled regression execution and extending coverage with additional edge-case and cross-browser scenarios in upcoming cycles.'
          ),
          new Paragraph(''),
          new Paragraph('Prepared by: QA Automation Team'),
        ],
      },
    ],
  });

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  const outputDir = path.join(root, 'deliverable', 'latest');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, `Automation_Test_Report_${stamp}.docx`);
  const latestFile = path.join(outputDir, 'Automation_Test_Report_Latest.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputFile, buffer);

  try {
    fs.writeFileSync(latestFile, buffer);
  } catch (error) {
    // Keep report generation successful even if client has the alias document open.
    console.warn(`Could not update latest alias file: ${latestFile}`);
    console.warn(`Reason: ${error.message || error}`);
  }

  console.log(`DOCX report created: ${outputFile}`);
  console.log(`DOCX latest alias file: ${latestFile}`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
