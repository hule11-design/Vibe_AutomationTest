const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = process.cwd();

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
    .trim();
}

function sheetToMarkdown(sheetName, worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  let md = `## Sheet: ${sheetName}\n\n`;

  if (!rows.length) {
    md += '_Empty sheet_\n\n';
    return md;
  }

  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const normalizedRows = rows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push('');
    return padded;
  });

  const headerRow = normalizedRows[0].map(escapeCell);
  const bodyRows = normalizedRows.slice(1).map((row) => row.map(escapeCell));

  md += `| ${headerRow.join(' | ')} |\n`;
  md += `| ${headerRow.map(() => '---').join(' | ')} |\n`;

  if (bodyRows.length) {
    for (const row of bodyRows) {
      md += `| ${row.join(' | ')} |\n`;
    }
  } else {
    md += `| ${headerRow.map(() => '').join(' | ')} |\n`;
  }

  md += '\n';
  return md;
}

function convertFile(xlsxPath) {
  const workbook = XLSX.readFile(xlsxPath);
  const outputPath = xlsxPath.replace(/\.xlsx$/i, '.md');

  let content = `# ${path.basename(xlsxPath)}\n\n`;

  for (const sheetName of workbook.SheetNames) {
    content += sheetToMarkdown(sheetName, workbook.Sheets[sheetName]);
  }

  fs.writeFileSync(outputPath, content, 'utf8');
  return outputPath;
}

function main() {
  const files = fs.readdirSync(rootDir)
    .filter((name) => name.toLowerCase().endsWith('.xlsx'))
    .filter((name) => !name.startsWith('~$'))
    .map((name) => path.join(rootDir, name));

  if (!files.length) {
    console.log('No .xlsx files found.');
    return;
  }

  const results = files.map(convertFile);
  console.log('Converted files:');
  for (const file of results) {
    console.log(`- ${path.relative(rootDir, file)}`);
  }
}

main();
