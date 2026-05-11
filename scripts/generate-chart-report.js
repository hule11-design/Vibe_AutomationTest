// Generate Chart Report from Playwright JSON Results
const fs = require('fs');
const path = require('path');

// Đọc JSON report
const jsonReport = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../test-results/json-report.json'), 'utf8')
);

// Tạo HTML chart report
const generateChartHTML = (results) => {
  // Extract all tests từ nested suites structure
  const allTests = [];
  const extractTests = (suites) => {
    suites.forEach(suite => {
      if (suite.suites) {
        extractTests(suite.suites);
      }
      if (suite.specs) {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            allTests.push({
              title: spec.title,
              status: test.results[0]?.status || 'unknown',
              duration: test.results[0]?.duration || 0,
              expectedStatus: test.expectedStatus
            });
          });
        });
      }
    });
  };
  
  extractTests(results.suites);

  const testsByStatus = {
    passed: allTests.filter(t => t.status === 'passed').length,
    failed: allTests.filter(t => t.status === 'failed').length,
    skipped: allTests.filter(t => t.status === 'skipped').length
  };

  const testsByDuration = allTests
    .sort((a, b) => b.duration - a.duration);

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Results Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 400px; height: 300px; margin: 20px; display: inline-block; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>📊 Test Results Dashboard</h1>
    
    <div class="summary">
        <h2>📈 Summary</h2>
        <p><strong>Total Tests:</strong> ${testsByStatus.passed + testsByStatus.failed + testsByStatus.skipped}</p>
        <p><strong>✅ Passed:</strong> ${testsByStatus.passed}</p>
        <p><strong>❌ Failed:</strong> ${testsByStatus.failed}</p>
        <p><strong>⏭️ Skipped:</strong> ${testsByStatus.skipped}</p>
        <p><strong>⏱️ Total Duration:</strong> ${Math.round(allTests.reduce((sum, t) => sum + t.duration, 0) / 1000)}s</p>
    </div>

    <div class="chart-container">
        <canvas id="statusChart"></canvas>
    </div>

    <div class="chart-container">
        <canvas id="durationChart"></canvas>
    </div>

    <script>
        // Pie Chart - Test Status
        new Chart(document.getElementById('statusChart'), {
            type: 'pie',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [${testsByStatus.passed}, ${testsByStatus.failed}, ${testsByStatus.skipped}],
                    backgroundColor: ['#28a745', '#dc3545', '#6c757d']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Test Status Distribution' }
                }
            }
        });

        // Bar Chart - Test Duration  
        new Chart(document.getElementById('durationChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(testsByDuration.slice(0, 10).map(t => t.title.substring(0, 30) + '...'))},
                datasets: [{
                    label: 'Duration (ms)',
                    data: ${JSON.stringify(testsByDuration.slice(0, 10).map(t => t.duration))},
                    backgroundColor: ${JSON.stringify(testsByDuration.slice(0, 10).map(t => 
                      t.status === 'passed' ? '#28a745' : '#dc3545'
                    ))}
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Top 10 Slowest Tests' }
                },
                scales: {
                    x: { ticks: { maxRotation: 45 } }
                }
            }
        });
    </script>
</body>
</html>`;
};

// Tạo và lưu HTML chart
const chartHTML = generateChartHTML(jsonReport);
const outputPath = path.join(__dirname, '../test-results/chart-report.html');
fs.writeFileSync(outputPath, chartHTML);

console.log('📊 Chart report generated:', outputPath);
console.log('🌐 Open in browser to view charts!');