// 🎨 Advanced Interactive Test Dashboard Generator
const fs = require('fs');
const path = require('path');

// Đọc JSON report
const jsonReport = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../test-results/json-report.json'), 'utf8')
);

// Tạo Advanced HTML Dashboard với Animations
const generateAdvancedDashboard = (results) => {
  // Extract all tests từ nested suites structure
  const allTests = [];
  const suiteStats = new Map();
  
  const extractTests = (suites, suitePath = '') => {
    suites.forEach(suite => {
      const currentPath = suitePath ? `${suitePath} › ${suite.title}` : suite.title;
      
      if (suite.suites) {
        extractTests(suite.suites, currentPath);
      }
      if (suite.specs) {
        let suitePassCount = 0;
        let suiteFailCount = 0;
        let suiteTotalDuration = 0;
        
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            const testData = {
              title: spec.title,
              suite: currentPath,
              status: test.results[0]?.status || 'unknown',
              duration: test.results[0]?.duration || 0,
              expectedStatus: test.expectedStatus,
              error: test.results[0]?.error?.message || null
            };
            
            allTests.push(testData);
            
            if (testData.status === 'passed') suitePassCount++;
            else if (testData.status === 'failed') suiteFailCount++;
            suiteTotalDuration += testData.duration;
          });
        });
        
        suiteStats.set(currentPath, {
          passed: suitePassCount,
          failed: suiteFailCount,
          total: suitePassCount + suiteFailCount,
          duration: suiteTotalDuration
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

  const testsByDuration = allTests.sort((a, b) => b.duration - a.duration);
  const totalDuration = allTests.reduce((sum, t) => sum + t.duration, 0);
  const avgDuration = totalDuration / allTests.length;
    const timelineShortLabels = testsByDuration.map((test, index) => {
        const suiteName = test.suite.split(' › ').pop() || `Test ${index + 1}`;
        return suiteName.split(':')[0].trim();
    });
    const timelineTooltipLabels = testsByDuration.map((test, index) => {
        const suiteName = test.suite.split(' › ').pop() || `Test ${index + 1}`;
        return {
            suiteName,
            testTitle: test.title,
            duration: test.duration
        };
    });
  
  // Performance categories
  const fastTests = allTests.filter(t => t.duration < avgDuration * 0.5).sort((a, b) => a.duration - b.duration);
  const mediumTests = allTests.filter(t => t.duration >= avgDuration * 0.5 && t.duration < avgDuration * 2).sort((a, b) => a.duration - b.duration);
  const slowTests = allTests.filter(t => t.duration >= avgDuration * 2).sort((a, b) => b.duration - a.duration);
  const performanceCategories = {
    fast: fastTests.length,
    medium: mediumTests.length,
    slow: slowTests.length
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 Advanced Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            overflow-x: hidden;
        }
        
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            opacity: 0;
            transform: translateY(30px);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            transform: scale(0.8);
            opacity: 0;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .metric-label {
            color: #666;
            font-size: 1.1em;
        }
        
        .success { color: #28a745; }
        .danger { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        
        .charts-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .chart-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            transform: translateY(50px);
            opacity: 0;
        }
        
        .chart-title {
            text-align: center;
            font-size: 1.4em;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
        }
        
        .progress-bars {
            margin-top: 20px;
        }
        
        .progress-item {
            margin-bottom: 15px;
        }
        
        .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .progress-bar {
            height: 8px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 2s ease-in-out;
            position: relative;
            overflow: hidden;
        }
        
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: shine 2s infinite;
        }
        
        @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .performance-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .test-list {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 25px;
            margin-top: 20px;
            backdrop-filter: blur(10px);
        }
        
        .test-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin: 8px 0;
            border-radius: 8px;
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
        }
        
        .test-item:hover {
            background: rgba(0,0,0,0.05);
            transform: translateX(5px);
        }
        
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        
        .floating-elements {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .floating-circle {
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @media (max-width: 768px) {
            .charts-container {
                grid-template-columns: 1fr;
            }
            .metric-card {
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
    </div>
    
    <div class="floating-elements" id="floatingElements"></div>
    
    <div class="dashboard-container">
        <div class="header">
            <h1>🎨 Advanced Test Dashboard</h1>
            <div class="subtitle">Interactive Visual Analytics • Real-time Insights</div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value success" id="totalTests">${allTests.length}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value success" id="passedTests">${testsByStatus.passed}</div>
                <div class="metric-label">✅ Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value danger" id="failedTests">${testsByStatus.failed}</div>
                <div class="metric-label">❌ Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value info" id="totalDuration">${Math.round(totalDuration / 1000)}s</div>
                <div class="metric-label">⏱️ Total Time</div>
            </div>
        </div>
        
        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-title">🥧 Test Status Distribution</div>
                <div class="chart-container">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">⚡ Performance Categories</div>
                <div class="chart-container" style="height:180px">
                    <canvas id="performanceChart"></canvas>
                </div>
                <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
                    <div style="background:rgba(40,167,69,0.1);border-radius:10px;padding:12px">
                        <div style="font-weight:700;color:#28a745;margin-bottom:8px">🚀 Fast (${fastTests.length})</div>
                        ${fastTests.map(t => `<div style="font-size:0.82em;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.06);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.title}">${t.suite.split(' › ').pop().split(':')[0].trim()} — ${Math.round(t.duration)}ms</div>`).join('')}
                    </div>
                    <div style="background:rgba(255,193,7,0.1);border-radius:10px;padding:12px">
                        <div style="font-weight:700;color:#e6a817;margin-bottom:8px">⚡ Medium (${mediumTests.length})</div>
                        ${mediumTests.map(t => `<div style="font-size:0.82em;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.06);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.title}">${t.suite.split(' › ').pop().split(':')[0].trim()} — ${Math.round(t.duration)}ms</div>`).join('')}
                    </div>
                    <div style="background:rgba(220,53,69,0.1);border-radius:10px;padding:12px">
                        <div style="font-weight:700;color:#dc3545;margin-bottom:8px">🐌 Slow (${slowTests.length})</div>
                        ${slowTests.map(t => `<div style="font-size:0.82em;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.06);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.title}">${t.suite.split(' › ').pop().split(':')[0].trim()} — ${Math.round(t.duration)}ms</div>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">📊 Execution Time Analysis</div>
                <div class="chart-container">
                    <canvas id="durationChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">📈 Suite Performance</div>
                <div class="progress-bars">
                    ${Array.from(suiteStats.entries()).map(([suiteName, stats]) => `
                        <div class="progress-item">
                            <div class="progress-label">
                                <span>
                                    <span class="performance-indicator ${stats.failed > 0 ? 'danger' : 'success'}" style="background: ${stats.failed > 0 ? '#dc3545' : '#28a745'}"></span>
                                    ${suiteName}
                                </span>
                                <span>${stats.passed}/${stats.total} (${Math.round(stats.passed/stats.total*100)}%)</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 0%; background: linear-gradient(90deg, ${stats.failed > 0 ? '#dc3545' : '#28a745'}, ${stats.failed > 0 ? '#ff6b6b' : '#51cf66'})" data-width="${Math.round(stats.passed/stats.total*100)}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="test-list">
            <h3>🔍 Test Details</h3>
            ${testsByDuration.slice(0, 10).map(test => `
                <div class="test-item ${test.status}">
                    <span>
                        <strong>${test.title}</strong>
                        <br><small style="color: #666;">${test.suite}</small>
                    </span>
                    <span style="font-weight: bold; color: ${test.status === 'passed' ? '#28a745' : '#dc3545'}">
                        ${Math.round(test.duration)}ms
                    </span>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // 🎨 Advanced Dashboard Initialization
        document.addEventListener('DOMContentLoaded', function() {
            initializeFloatingElements();
            setTimeout(initializeDashboard, 1000);
        });
        
        function initializeFloatingElements() {
            const container = document.getElementById('floatingElements');
            for (let i = 0; i < 15; i++) {
                const circle = document.createElement('div');
                circle.className = 'floating-circle';
                circle.style.width = Math.random() * 100 + 20 + 'px';
                circle.style.height = circle.style.width;
                circle.style.left = Math.random() * 100 + '%';
                circle.style.top = Math.random() * 100 + '%';
                circle.style.animationDelay = Math.random() * 6 + 's';
                circle.style.animationDuration = (Math.random() * 4 + 4) + 's';
                container.appendChild(circle);
            }
        }
        
        function initializeDashboard() {
            // Hide loading overlay
            gsap.to('#loadingOverlay', { opacity: 0, duration: 0.5, onComplete: () => {
                document.getElementById('loadingOverlay').style.display = 'none';
            }});
            
            // Animate container
            gsap.to('.dashboard-container', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' });
            
            // Animate metric cards
            gsap.to('.metric-card', { 
                scale: 1, 
                opacity: 1, 
                duration: 0.6, 
                stagger: 0.1, 
                ease: 'back.out(1.7)',
                delay: 0.5
            });
            
            // Animate chart cards
            gsap.to('.chart-card', { 
                y: 0, 
                opacity: 1, 
                duration: 0.8, 
                stagger: 0.2, 
                ease: 'power2.out',
                delay: 0.8
            });
            
            // Initialize charts
            setTimeout(initializeCharts, 1200);
            setTimeout(animateProgressBars, 1500);
            setTimeout(animateCounters, 800);
        }
        
        function animateCounters() {
            const counters = [
                { id: 'totalTests', target: ${allTests.length} },
                { id: 'passedTests', target: ${testsByStatus.passed} },
                { id: 'failedTests', target: ${testsByStatus.failed} },
                { id: 'totalDuration', target: ${Math.round(totalDuration / 1000)} }
            ];
            
            counters.forEach(counter => {
                gsap.to({ val: 0 }, {
                    val: counter.target,
                    duration: 2,
                    ease: 'power2.out',
                    onUpdate: function() {
                        const element = document.getElementById(counter.id);
                        if (counter.id === 'totalDuration') {
                            element.textContent = Math.round(this.targets()[0].val) + 's';
                        } else {
                            element.textContent = Math.round(this.targets()[0].val);
                        }
                    }
                });
            });
        }
        
        function animateProgressBars() {
            document.querySelectorAll('.progress-fill').forEach(bar => {
                const targetWidth = bar.getAttribute('data-width');
                gsap.to(bar, { width: targetWidth, duration: 2, ease: 'power2.out' });
            });
        }
        
        function initializeCharts() {
            // Status Pie Chart với Animation
            new Chart(document.getElementById('statusChart'), {
                type: 'doughnut',
                data: {
                    labels: ['✅ Passed', '❌ Failed', '⏭️ Skipped'],
                    datasets: [{
                        data: [${testsByStatus.passed}, ${testsByStatus.failed}, ${testsByStatus.skipped}],
                        backgroundColor: [
                            'linear-gradient(45deg, #28a745, #51cf66)',
                            'linear-gradient(45deg, #dc3545, #ff6b6b)', 
                            'linear-gradient(45deg, #6c757d, #868e96)'
                        ],
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: { 
                                padding: 20,
                                font: { size: 12, weight: '500' }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 2000,
                        easing: 'easeOutBounce'
                    }
                }
            });
            
            // Performance Chart
            new Chart(document.getElementById('performanceChart'), {
                type: 'bar',
                data: {
                    labels: ['🚀 Fast', '⚡ Medium', '🐌 Slow'],
                    datasets: [{
                        label: 'Test Count',
                        data: [${performanceCategories.fast}, ${performanceCategories.medium}, ${performanceCategories.slow}],
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.8)',
                            'rgba(255, 193, 7, 0.8)',
                            'rgba(220, 53, 69, 0.8)'
                        ],
                        borderColor: [
                            '#28a745',
                            '#ffc107', 
                            '#dc3545'
                        ],
                        borderWidth: 2,
                        borderRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.1)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    },
                    animation: {
                        duration: 2000,
                        easing: 'easeOutElastic'
                    }
                }
            });
            
            // Duration Analysis Chart
            new Chart(document.getElementById('durationChart'), {
                type: 'line',
                data: {
                    labels: ${JSON.stringify(timelineShortLabels)},
                    datasets: [{
                        label: 'Duration (ms)',
                        data: ${JSON.stringify(testsByDuration.map(t => t.duration))},
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: ${JSON.stringify(testsByDuration.map(t => 
                            t.status === 'passed' ? '#28a745' : '#dc3545'
                        ))},
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: function(items) {
                                    const details = ${JSON.stringify(timelineTooltipLabels)}[items[0].dataIndex];
                                    return details.suiteName;
                                },
                                label: function(context) {
                                    const details = ${JSON.stringify(timelineTooltipLabels)}[context.dataIndex];
                                    return details.testTitle + ' (' + details.duration + ' ms)';
                                }
                            }
                        }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.1)' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                autoSkip: false,
                                maxRotation: 0,
                                minRotation: 0,
                                font: { size: 10 }
                            }
                        }
                    },
                    animation: {
                        duration: 3000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }
    </script>
</body>
</html>`;
};

// Tạo và lưu Advanced Dashboard
const advancedHTML = generateAdvancedDashboard(jsonReport);
const outputPath = path.join(__dirname, '../test-results/advanced-dashboard.html');
fs.writeFileSync(outputPath, advancedHTML);

console.log('🎨 Advanced Dashboard created:', outputPath);
console.log('🚀 Features: Animations, Interactive Charts, Progress Bars, Floating Elements');
console.log('✨ Open in browser for full experience!');