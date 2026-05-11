// 🎭 Ultra Dynamic Test Dashboard Generator
const fs = require('fs');
const path = require('path');

const jsonReport = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../test-results/json-report.json'), 'utf8')
);

const generateUltraDashboard = (results) => {
  // Data extraction như trước
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
  const successRate = Math.round((testsByStatus.passed / allTests.length) * 100);

  // Phân loại test theo tốc độ
  const fastTests = allTests.filter(t => t.duration < avgDuration * 0.5).sort((a, b) => a.duration - b.duration);
  const mediumTests = allTests.filter(t => t.duration >= avgDuration * 0.5 && t.duration < avgDuration * 2).sort((a, b) => a.duration - b.duration);
  const slowTests = allTests.filter(t => t.duration >= avgDuration * 2).sort((a, b) => b.duration - a.duration);

  // Radar scores - tính tự động từ kết quả test
  // Reliability: tỉ lệ pass (0-100)
  const radarReliability = successRate;
  // Speed: mỗi giây trung bình trừ 1.5 điểm, tối đa 100 tại 0s, tối thiểu 0
  const radarSpeed = Math.round(Math.max(0, Math.min(100, 100 - (avgDuration / 1000) * 1.5)));
  // Coverage: 15 test = 100%, scale tuyến tính, capped at 100
  const radarCoverage = Math.min(100, Math.round((allTests.length / 15) * 100));
  // Stability: 70% từ pass rate + 30% từ tỉ lệ test không chậm (duration < avgDuration*2)
  const slowCount = allTests.filter(t => t.duration >= avgDuration * 2).length;
  const radarStability = Math.round(radarReliability * 0.7 + (1 - slowCount / allTests.length) * 30);
  // Performance: điểm tổng hợp trung bình 3 trục chính
  const radarPerformance = Math.round((radarSpeed + radarReliability + radarStability) / 3);

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

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎭 Ultra Dynamic Test Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            min-height: 100vh;
            color: #333;
            overflow-x: hidden;
        }
        
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        #particles-js {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: -1;
        }
        
        .dashboard-container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
            opacity: 0;
            transform: translateY(50px);
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
            color: white;
            position: relative;
        }
        
        .header h1 {
            font-size: 4em;
            margin-bottom: 15px;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.4);
            background: linear-gradient(45deg, #fff, #f0f0f0, #fff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: textShine 3s ease-in-out infinite alternate;
        }
        
        @keyframes textShine {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        
        .header .subtitle {
            font-size: 1.4em;
            opacity: 0.95;
            animation: pulse 2s ease-in-out infinite alternate;
        }
        
        .success-indicator {
            position: absolute;
            top: -20px;
            right: 50%;
            transform: translateX(50%);
            background: ${successRate >= 80 ? '#28a745' : successRate >= 60 ? '#ffc107' : '#dc3545'};
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            animation: bounce 2s infinite;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateX(50%) translateY(0); }
            40% { transform: translateX(50%) translateY(-10px); }
            60% { transform: translateX(50%) translateY(-5px); }
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            transform: scale(0.8) rotateY(180deg);
            opacity: 0;
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
            color: white;
        }
        
        .metric-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: cardShine 4s linear infinite;
        }
        
        @keyframes cardShine {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .metric-card:hover {
            transform: translateY(-15px) scale(1.05);
            box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }
        
        .metric-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
            animation: iconFloat 3s ease-in-out infinite;
        }
        
        @keyframes iconFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .metric-value {
            font-size: 3em;
            font-weight: bold;
            margin: 15px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .metric-label {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .charts-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .chart-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 25px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(15px);
            transform: translateY(100px) rotateX(30deg);
            opacity: 0;
            position: relative;
            overflow: hidden;
        }
        
        .chart-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: slideShine 3s infinite;
        }
        
        @keyframes slideShine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .chart-title {
            text-align: center;
            font-size: 1.5em;
            font-weight: 700;
            margin-bottom: 25px;
            color: #333;
            position: relative;
            z-index: 1;
        }
        
        .chart-container {
            position: relative;
            height: 350px;
            z-index: 1;
        }
        
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .performance-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 25px;
            color: white;
            position: relative;
            overflow: hidden;
            transform: scale(0.9);
            opacity: 0;
        }
        
        .performance-title {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .performance-list {
            list-style: none;
        }
        
        .performance-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            animation: slideInLeft 0.6s ease-out forwards;
            opacity: 0;
            transform: translateX(-30px);
        }
        
        @keyframes slideInLeft {
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .test-status-icon {
            font-size: 1.2em;
            margin-right: 10px;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        .loading-content {
            text-align: center;
            color: white;
        }
        
        .loading-spinner {
            width: 80px;
            height: 80px;
            border: 5px solid rgba(255,255,255,0.3);
            border-top: 5px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        .loading-text {
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        
        .loading-progress {
            width: 300px;
            height: 8px;
            background: rgba(255,255,255,0.3);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 15px;
        }
        
        .loading-bar {
            height: 100%;
            background: white;
            border-radius: 4px;
            width: 0%;
            animation: loadProgress 3s ease-in-out;
        }
        
        @keyframes loadProgress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        
        .realtime-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            z-index: 1000;
            animation: pulse 2s infinite;
        }
        
        .realtime-indicator::before {
            content: '●';
            color: #90ee90;
            margin-right: 5px;
            animation: blink 1s infinite;
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 2.5em; }
            .charts-container { grid-template-columns: 1fr; }
            .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div id="particles-js"></div>
    
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">🎭 Initializing Ultra Dashboard</div>
            <div class="loading-text" style="font-size: 1em; opacity: 0.8;">Preparing visual effects...</div>
            <div class="loading-progress">
                <div class="loading-bar"></div>
            </div>
        </div>
    </div>
    
    <div class="realtime-indicator">Live Dashboard</div>
    
    <div class="dashboard-container">
        <div class="header">
            <div class="success-indicator">Success Rate: ${successRate}%</div>
            <h1>🎭 Ultra Dynamic Dashboard</h1>
            <div class="subtitle">Real-time • Interactive • Animated • Beautiful</div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon">📊</div>
                <div class="metric-value" id="totalTests">0</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">✅</div>
                <div class="metric-value" id="passedTests">0</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">❌</div>
                <div class="metric-value" id="failedTests">0</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">⚡</div>
                <div class="metric-value" id="avgDuration">0</div>
                <div class="metric-label">Avg Time (ms)</div>
            </div>
        </div>
        
        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-title">🎯 Success Rate Overview</div>
                <div class="chart-container">
                    <canvas id="successChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">⏱️ Performance Radar</div>
                <div class="chart-container">
                    <canvas id="radarChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">📈 Test Timeline</div>
                <div class="chart-container">
                    <canvas id="timelineChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">🎨 3D Performance</div>
                <div class="chart-container" style="height:200px">
                    <canvas id="performanceChart3D"></canvas>
                </div>
                <div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
                    <div style="background:rgba(40,167,69,0.12);border-radius:12px;padding:12px">
                        <div style="font-weight:700;color:#28a745;margin-bottom:8px">🚀 Fast (${fastTests.length})</div>
                        ${fastTests.map(t => `<div style="font-size:0.82em;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.06);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.title}">${t.suite.split(' › ').pop().split(':')[0].trim()} — ${Math.round(t.duration)}ms</div>`).join('')}
                    </div>
                    <div style="background:rgba(255,193,7,0.12);border-radius:12px;padding:12px">
                        <div style="font-weight:700;color:#e6a817;margin-bottom:8px">⚡ Medium (${mediumTests.length})</div>
                        ${mediumTests.map(t => `<div style="font-size:0.82em;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.06);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.title}">${t.suite.split(' › ').pop().split(':')[0].trim()} — ${Math.round(t.duration)}ms</div>`).join('')}
                    </div>
                    <div style="background:rgba(220,53,69,0.12);border-radius:12px;padding:12px">
                        <div style="font-weight:700;color:#dc3545;margin-bottom:8px">🐌 Slow (${slowTests.length})</div>
                        ${slowTests.map(t => `<div style="font-size:0.82em;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.06);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.title}">${t.suite.split(' › ').pop().split(':')[0].trim()} — ${Math.round(t.duration)}ms</div>`).join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="performance-grid">
            <div class="performance-card">
                <div class="performance-title">
                    <i class="fas fa-rocket"></i>
                    Fastest Tests
                </div>
                <ul class="performance-list">
                    ${testsByDuration.slice(-5).reverse().map((test, i) => `
                        <li class="performance-item" style="animation-delay: ${i * 0.1}s">
                            <span>
                                <span class="test-status-icon">${test.status === 'passed' ? '✅' : '❌'}</span>
                                ${test.title.substring(0, 40)}...
                            </span>
                            <span style="color: #90ee90;">${Math.round(test.duration)}ms</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="performance-card">
                <div class="performance-title">
                    <i class="fas fa-turtle"></i>
                    Slowest Tests
                </div>
                <ul class="performance-list">
                    ${testsByDuration.slice(0, 5).map((test, i) => `
                        <li class="performance-item" style="animation-delay: ${i * 0.1}s">
                            <span>
                                <span class="test-status-icon">${test.status === 'passed' ? '✅' : '❌'}</span>
                                ${test.title.substring(0, 40)}...
                            </span>
                            <span style="color: #ffb3b3;">${Math.round(test.duration)}ms</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    </div>

    <script>
        // 🎭 Ultra Dashboard Initialization
        document.addEventListener('DOMContentLoaded', function() {
            initializeParticles();
            setTimeout(initializeDashboard, 3000);
        });
        
        function initializeParticles() {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 50, density: { enable: true, value_area: 800 } },
                    color: { value: '#ffffff' },
                    shape: { 
                        type: 'circle',
                        stroke: { width: 0, color: '#000000' }
                    },
                    opacity: { 
                        value: 0.3, 
                        random: true,
                        anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
                    },
                    size: { 
                        value: 3, 
                        random: true,
                        anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#ffffff',
                        opacity: 0.2,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 2,
                        direction: 'none',
                        random: false,
                        straight: false,
                        out_mode: 'out',
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: { enable: true, mode: 'repulse' },
                        onclick: { enable: true, mode: 'push' },
                        resize: true
                    },
                    modes: {
                        grab: { distance: 400, line_linked: { opacity: 1 } },
                        bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
                        repulse: { distance: 200, duration: 0.4 },
                        push: { particles_nb: 4 },
                        remove: { particles_nb: 2 }
                    }
                },
                retina_detect: true
            });
        }
        
        function initializeDashboard() {
            // Hide loading overlay với hiệu ứng
            gsap.to('#loadingOverlay', { 
                opacity: 0, 
                scale: 0.8,
                duration: 1,
                ease: 'power2.out',
                onComplete: () => {
                    document.getElementById('loadingOverlay').style.display = 'none';
                }
            });
            
            // Animate container
            gsap.to('.dashboard-container', { 
                opacity: 1, 
                y: 0, 
                duration: 1.5, 
                ease: 'power3.out',
                delay: 0.5
            });
            
            // Animate metric cards với 3D effect
            gsap.to('.metric-card', { 
                scale: 1,
                rotateY: 0,
                opacity: 1, 
                duration: 0.8, 
                stagger: 0.15, 
                ease: 'back.out(2)',
                delay: 1
            });
            
            // Animate chart cards với 3D transform
            gsap.to('.chart-card', { 
                y: 0,
                rotateX: 0,
                opacity: 1, 
                duration: 1, 
                stagger: 0.2, 
                ease: 'power3.out',
                delay: 1.3
            });
            
            // Animate performance cards
            gsap.to('.performance-card', { 
                scale: 1,
                opacity: 1, 
                duration: 0.8, 
                stagger: 0.1, 
                ease: 'elastic.out(1, 0.8)',
                delay: 1.8
            });
            
            // Initialize effects
            setTimeout(animateCounters, 1500);
            setTimeout(initializeCharts, 2000);
        }
        
        function animateCounters() {
            const counters = [
                { id: 'totalTests', target: ${allTests.length}, suffix: '' },
                { id: 'passedTests', target: ${testsByStatus.passed}, suffix: '' },
                { id: 'failedTests', target: ${testsByStatus.failed}, suffix: '' },
                { id: 'avgDuration', target: ${Math.round(avgDuration)}, suffix: '' }
            ];
            
            counters.forEach((counter, i) => {
                gsap.to({ val: 0 }, {
                    val: counter.target,
                    duration: 2,
                    delay: i * 0.2,
                    ease: 'power2.out',
                    onUpdate: function() {
                        const element = document.getElementById(counter.id);
                        element.textContent = Math.round(this.targets()[0].val) + counter.suffix;
                    }
                });
            });
        }
        
        function initializeCharts() {
            // Success Rate Gauge Chart
            new Chart(document.getElementById('successChart'), {
                type: 'doughnut',
                data: {
                    labels: ['Success', 'Remaining'],
                    datasets: [{
                        data: [${successRate}, ${100 - successRate}],
                        backgroundColor: ['#28a745', 'rgba(255,255,255,0.2)'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 3000,
                        easing: 'easeOutBounce'
                    }
                }
            });
            
            // Radar Performance Chart
            new Chart(document.getElementById('radarChart'), {
                type: 'radar',
                data: {
                    labels: ['Speed', 'Reliability', 'Coverage', 'Stability', 'Performance'],
                    datasets: [{
                        label: 'Test Metrics',
                        data: [${radarSpeed}, ${radarReliability}, ${radarCoverage}, ${radarStability}, ${radarPerformance}],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 2000, easing: 'easeOutElastic' },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.3)' },
                            angleLines: { color: 'rgba(255, 255, 255, 0.3)' },
                            pointLabels: { color: '#333', font: { size: 12 } }
                        }
                    }
                }
            });
            
            // Timeline Chart
            new Chart(document.getElementById('timelineChart'), {
                type: 'line',
                data: {
                    labels: ${JSON.stringify(timelineShortLabels)},
                    datasets: [{
                        label: 'Execution Time',
                        data: ${JSON.stringify(testsByDuration.map(t => t.duration))},
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { 
                        duration: 3000,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: { display: false },
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
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } },
                        x: {
                            grid: { display: false },
                            ticks: {
                                autoSkip: false,
                                maxRotation: 0,
                                minRotation: 0,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
            
            // 3D Performance Bar Chart
            new Chart(document.getElementById('performanceChart3D'), {
                type: 'bar',
                data: {
                    labels: ['Fast', 'Medium', 'Slow'],
                    datasets: [{
                        label: 'Test Distribution',
                        data: [${fastTests.length}, ${mediumTests.length}, ${slowTests.length}],
                        backgroundColor: [
                            'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                            'linear-gradient(45deg, #feca57, #ff9ff3)',
                            'linear-gradient(45deg, #48dbfb, #0abde3)'
                        ],
                        borderWidth: 0,
                        borderRadius: 15,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { 
                        duration: 2500,
                        easing: 'easeOutBounce'
                    },
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    </script>
</body>
</html>`;
};

// Generate Ultra Dashboard
const ultraHTML = generateUltraDashboard(jsonReport);
const outputPath = path.join(__dirname, '../test-results/ultra-dashboard.html');
fs.writeFileSync(outputPath, ultraHTML);

console.log('🎭 Ultra Dynamic Dashboard created:', outputPath);
console.log('🎪 Features: Particles.js, 3D Effects, Radar Charts, Animated Progress');
console.log('🌟 Next Level: Real-time Updates, Interactive Particles, Advanced Animations!');