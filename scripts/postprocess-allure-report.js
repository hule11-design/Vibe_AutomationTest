const fs = require('fs');
const path = require('path');

const reportDir = process.argv[2] || 'allure-report';
const resultsDir = process.argv[3] || 'allure-results';
const categoriesWidgetPath = path.join(reportDir, 'widgets', 'categories.json');
const executorsWidgetPath = path.join(reportDir, 'widgets', 'executors.json');
const resultsCategoriesPath = path.join(resultsDir, 'categories.json');
const resultsExecutorPath = path.join(resultsDir, 'executor.json');
const indexPath = path.join(reportDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('[postprocess-allure] Skip: index.html not found');
  process.exit(0);
}

let hasCategoryData = false;
let hasExecutorData = false;

if (fs.existsSync(categoriesWidgetPath)) {
  try {
    const categories = JSON.parse(fs.readFileSync(categoriesWidgetPath, 'utf8'));
    hasCategoryData = Number(categories.total || 0) > 0 || (categories.items || []).length > 0;
  } catch (error) {
    console.log('[postprocess-allure] Skip: categories widget is not valid JSON');
    process.exit(0);
  }
} else {
  hasCategoryData = fs.existsSync(resultsCategoriesPath);
}

if (fs.existsSync(executorsWidgetPath)) {
  try {
    const executors = JSON.parse(fs.readFileSync(executorsWidgetPath, 'utf8'));
    hasExecutorData = Array.isArray(executors) ? executors.length > 0 : Boolean(executors && Object.keys(executors).length > 0);
  } catch (error) {
    console.log('[postprocess-allure] Skip: executors widget is not valid JSON');
    process.exit(0);
  }
} else {
  hasExecutorData = fs.existsSync(resultsExecutorPath);
}

const sectionsToHide = [];
if (!hasCategoryData) {
  sectionsToHide.push({ key: 'categories', label: 'Categories' });
}
if (!hasExecutorData) {
  sectionsToHide.push({ key: 'executors', label: 'Executors' });
}

if (sectionsToHide.length === 0) {
  console.log('[postprocess-allure] Categories and Executors data exist: keep UI unchanged');
  process.exit(0);
}

const markerStart = '<!-- copilot-hide-empty-sections:start -->';
const markerEnd = '<!-- copilot-hide-empty-sections:end -->';

let indexHtml = fs.readFileSync(indexPath, 'utf8');
if (indexHtml.includes(markerStart)) {
  console.log('[postprocess-allure] Hide snippet already exists');
  process.exit(0);
}

const styleSelectors = sectionsToHide
  .map(section => `[href*="#${section.key}"], [href*="${section.key}"], [data-id="${section.key}"]`)
  .join(',\n      ');

const snippet = `${markerStart}\n    <style id="copilot-hide-empty-sections-style">\n      ${styleSelectors} {\n        display: none !important;\n      }\n    </style>\n    <script>\n      (function () {\n        var sections = ${JSON.stringify(sectionsToHide)};\n\n        function shouldHideSectionByLabel(text) {\n          for (var x = 0; x < sections.length; x += 1) {\n            if (text === sections[x].label) {\n              return true;\n            }\n          }\n          return false;\n        }\n\n        function hideEmptySections() {\n          for (var s = 0; s < sections.length; s += 1) {\n            var key = sections[s].key;\n\n            if (window.location.hash && window.location.hash.toLowerCase().includes(key)) {\n              window.location.hash = '#';\n            }\n\n            var links = document.querySelectorAll('a[href*="' + key + '"], [data-id="' + key + '"]');\n            for (var i = 0; i < links.length; i += 1) {\n              var link = links[i];\n              var navItem = link.closest('li, .side-nav__item, .side-nav__group, .side-nav, .tree__item');\n              if (navItem) {\n                navItem.style.display = 'none';\n              }\n              link.style.display = 'none';\n            }\n          }\n\n          var nodes = document.querySelectorAll('h1, h2, h3, h4, span, a, div');\n          for (var j = 0; j < nodes.length; j += 1) {\n            var node = nodes[j];\n            var text = (node.textContent || '').trim();\n            if (!shouldHideSectionByLabel(text)) continue;\n\n            var container = node.closest('.widget, .widgets-grid__col, .table, .table__row, tr, section, article, div');\n            if (container) {\n              container.style.display = 'none';\n            }\n          }\n        }\n\n        var observer = new MutationObserver(hideEmptySections);\n        if (document.body) {\n          observer.observe(document.body, { childList: true, subtree: true });\n        }\n\n        hideEmptySections();\n        setTimeout(hideEmptySections, 500);\n        setTimeout(hideEmptySections, 1500);\n      })();\n    </script>\n    ${markerEnd}`;

indexHtml = indexHtml.replace('</body>', `${snippet}\n</body>`);
fs.writeFileSync(indexPath, indexHtml);
console.log(`[postprocess-allure] Hidden empty sections: ${sectionsToHide.map(section => section.label).join(', ')}`);
