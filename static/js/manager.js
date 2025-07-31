// Manager Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    if (document.querySelector('.manager-dashboard')) {
        loadDashboardData();
        loadRealTimeCharts();
        startRealTimeUpdates();
        initializeCharts();
        
        // Navigation
        document.querySelectorAll('.dashboard-nav a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('href').substring(1);
                showDashboardSection(sectionId);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('heva_token');
            window.location.href = '/login';
        });

        // Quick action buttons
        document.getElementById('generateStrategicReportBtn').addEventListener('click', function() {
            generateStrategicReport();
        });

        document.getElementById('programAnalysisBtn').addEventListener('click', function() {
            showProgramAnalysisModal();
        });

        document.getElementById('resourceAllocationBtn').addEventListener('click', function() {
            showResourceAllocationModal();
        });

        document.getElementById('performanceReviewBtn').addEventListener('click', function() {
            showPerformanceReviewModal();
        });

        // Funding management buttons
        document.getElementById('approveAllBtn')?.addEventListener('click', function() {
            approveAllPendingFunding();
        });

        document.getElementById('generateFundingReportBtn')?.addEventListener('click', function() {
            generateFundingReport();
        });

        document.getElementById('fundingAnalyticsBtn')?.addEventListener('click', function() {
            showFundingAnalytics();
        });
    }
});

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Load user data first
        await loadUserData(token);

        // Fetch manager dashboard data
        const response = await fetch('/api/manager/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();
        
        // Update stats with real data
        document.getElementById('totalBeneficiaries').textContent = data.total_beneficiaries;
        document.getElementById('activePrograms').textContent = data.active_programs;
        document.getElementById('fundUtilization').textContent = data.fund_utilization + '%';
        document.getElementById('impactScore').textContent = data.impact_score;

        // Update charts with real data
        updateCharts(data);

        // Load strategic insights
        loadStrategicInsights(data.insights);

    } catch (error) {
        console.error('Dashboard error:', error);
        showMessage('Failed to load dashboard data', 'error');
    }
}

async function loadRealTimeCharts() {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Fetch real-time chart data
        const response = await fetch('/api/manager/charts/real-time', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load chart data');
        }

        const chartData = await response.json();
        
        // Update all charts with real data
        updateRealTimeCharts(chartData);

    } catch (error) {
        console.error('Chart loading error:', error);
        showMessage('Failed to load chart data', 'error');
    }
}

function updateRealTimeCharts(chartData) {
    // Update program performance chart
    if (programPerformanceChart && chartData.vulnerability_distribution) {
        programPerformanceChart.data.labels = chartData.vulnerability_distribution.labels;
        programPerformanceChart.data.datasets[0].data = chartData.vulnerability_distribution.data;
        programPerformanceChart.update();
    }

    // Update regional distribution chart
    if (regionalDistributionChart && chartData.county_distribution) {
        regionalDistributionChart.data.labels = chartData.county_distribution.labels;
        regionalDistributionChart.data.datasets[0].data = chartData.county_distribution.data;
        regionalDistributionChart.update();
    }

    // Update funding distribution chart
    if (fundingDistributionChart && chartData.funding_distribution) {
        fundingDistributionChart.data.labels = chartData.funding_distribution.labels;
        fundingDistributionChart.data.datasets[0].data = chartData.funding_distribution.data;
        fundingDistributionChart.update();
    }

    // Update monthly trends chart
    if (monthlyTrendsChart && chartData.monthly_trends) {
        monthlyTrendsChart.data.labels = chartData.monthly_trends.labels;
        monthlyTrendsChart.data.datasets[0].data = chartData.monthly_trends.beneficiaries;
        monthlyTrendsChart.data.datasets[1].data = chartData.monthly_trends.funding;
        monthlyTrendsChart.update();
    }
}

async function loadUserData(token) {
    try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload.user_id;
        
        const userResponse = await fetch(`/api/auth/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            updateUserUI(userData);
        } else {
            updateUserUI({
                full_name: payload.full_name || 'Manager',
                role: payload.role || 'manager'
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        updateUserUI({
            full_name: 'Manager',
            role: 'manager'
        });
    }
}

function updateUserUI(userData) {
    const avatar = document.getElementById('userAvatar');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userRole = document.getElementById('userRole');
    
    if (avatar) {
        avatar.textContent = userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'M';
    }
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${userData.full_name || 'Manager'}`;
    }
    
    if (userRole) {
        userRole.textContent = `HEVA Manager | ${userData.location || 'System'}`;
    }
}

function showDashboardSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch(sectionId) {
            case 'funding':
                loadFundingData();
                break;
            case 'strategic':
                loadStrategicData();
                break;
            case 'reports':
                loadReports();
                break;
            case 'operations':
                loadOperations();
                break;
            case 'performance':
                loadPerformance();
                break;
            case 'profile':
                loadProfile();
                break;
        }
    }

    // Update nav highlight
    document.querySelectorAll('.dashboard-nav li').forEach(item => {
        item.classList.remove('active');
    });
    const navLink = document.querySelector(`.dashboard-nav a[href="#${sectionId}"]`);
    if (navLink) {
        navLink.parentElement.classList.add('active');
    }
}

// Chart initialization
let programPerformanceChart, regionalDistributionChart;

function initializeCharts() {
    // Initialize program performance chart
    const programPerformanceCtx = document.getElementById('programPerformanceChart');
    if (programPerformanceCtx) {
        programPerformanceChart = new Chart(programPerformanceCtx, {
            type: 'bar',
            data: {
                labels: ['Education', 'Healthcare', 'Livelihood', 'Housing', 'Financial'],
                datasets: [{
                    label: 'Performance Score',
                    data: [85, 92, 78, 88, 95],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Initialize regional distribution chart
    const regionalDistributionCtx = document.getElementById('regionalDistributionChart');
    if (regionalDistributionCtx) {
        regionalDistributionChart = new Chart(regionalDistributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Nairobi', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function updateCharts(data) {
    // Update program performance chart
    if (programPerformanceChart && data.program_performance) {
        programPerformanceChart.data.datasets[0].data = data.program_performance;
        programPerformanceChart.update();
    }

    // Update regional distribution chart
    if (regionalDistributionChart && data.regional_distribution) {
        regionalDistributionChart.data.datasets[0].data = data.regional_distribution.data;
        regionalDistributionChart.data.labels = data.regional_distribution.labels;
        regionalDistributionChart.update();
    }
}

function loadStrategicInsights(insights) {
    const container = document.getElementById('insightsGrid');
    if (container && insights) {
        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
            </div>
        `).join('');
    } else {
        // Default insights
        container.innerHTML = `
            <div class="insight-card">
                <h4>High Impact Programs</h4>
                <p>Education and healthcare programs showing 92% success rate</p>
            </div>
            <div class="insight-card">
                <h4>Resource Optimization</h4>
                <p>Fund utilization improved by 8% this quarter</p>
            </div>
            <div class="insight-card">
                <h4>Regional Growth</h4>
                <p>Nairobi region leads with 35% beneficiary coverage</p>
            </div>
            <div class="insight-card">
                <h4>Strategic Priorities</h4>
                <p>Focus on livelihood programs for sustainable impact</p>
            </div>
        `;
    }
}

// Strategic Section
async function loadStrategicData() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/manager/strategic', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const strategic = await response.json();
            const container = document.getElementById('strategic');
            if (container) {
                container.innerHTML = `
                    <div class="strategic-grid">
                        <div class="strategic-card">
                            <h3>Strategic Goals</h3>
                            <canvas id="strategicGoalsChart"></canvas>
                        </div>
                        <div class="strategic-card">
                            <h3>Resource Allocation</h3>
                            <canvas id="resourceAllocationChart"></canvas>
                        </div>
                        <div class="strategic-card">
                            <h3>Impact Metrics</h3>
                            <canvas id="impactMetricsChart"></canvas>
                        </div>
                        <div class="strategic-card">
                            <h3>Risk Assessment</h3>
                            <canvas id="riskAssessmentChart"></canvas>
                        </div>
                    </div>
                `;
                
                // Initialize strategic charts
                initializeStrategicCharts(strategic);
            }
        }
    } catch (error) {
        console.error('Error loading strategic data:', error);
    }
}

function initializeStrategicCharts(strategic) {
    // Strategic goals chart
    const goalsCtx = document.getElementById('strategicGoalsChart');
    if (goalsCtx) {
        new Chart(goalsCtx, {
            type: 'radar',
            data: {
                labels: ['Education', 'Healthcare', 'Livelihood', 'Housing', 'Financial'],
                datasets: [{
                    label: 'Current Progress',
                    data: [85, 92, 78, 88, 95],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Resource allocation chart
    const resourceCtx = document.getElementById('resourceAllocationChart');
    if (resourceCtx) {
        new Chart(resourceCtx, {
            type: 'pie',
            data: {
                labels: ['Education', 'Healthcare', 'Livelihood', 'Housing', 'Financial'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Impact metrics chart
    const impactCtx = document.getElementById('impactMetricsChart');
    if (impactCtx) {
        new Chart(impactCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Impact Score',
                    data: [65, 70, 75, 80, 85, 90],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Risk assessment chart
    const riskCtx = document.getElementById('riskAssessmentChart');
    if (riskCtx) {
        new Chart(riskCtx, {
            type: 'bar',
            data: {
                labels: ['Low', 'Medium', 'High'],
                datasets: [{
                    label: 'Risk Level',
                    data: [60, 30, 10],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Reports Section
async function loadReports() {
    const container = document.getElementById('reports');
    if (container) {
        container.innerHTML = `
            <div class="reports-grid">
                <div class="report-card">
                    <h4>Dashboard Report</h4>
                    <p>Comprehensive dashboard summary and metrics</p>
                    <button onclick="downloadDashboardReport('manager')" class="btn btn-primary">Download PDF</button>
                </div>
                <div class="report-card">
                    <h4>Beneficiary Report</h4>
                    <p>Detailed beneficiary information and statistics</p>
                    <button onclick="downloadBeneficiaryReport()" class="btn btn-primary">Download PDF</button>
                </div>
                <div class="report-card">
                    <h4>Funding Report</h4>
                    <p>Funding allocation and disbursement analysis</p>
                    <button onclick="downloadFundingReport()" class="btn btn-primary">Download PDF</button>
                </div>
                <div class="report-card">
                    <h4>Strategic Performance Report</h4>
                    <p>Comprehensive analysis of strategic goals and performance metrics</p>
                    <button onclick="generateStrategicReport()" class="btn btn-primary">Generate</button>
                </div>
            </div>
        `;
    }
}

// Operations Section
async function loadOperations() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/manager/operations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const operations = await response.json();
            const container = document.getElementById('operations');
            if (container) {
                container.innerHTML = `
                    <div class="operations-grid">
                        <div class="operation-card">
                            <h3>Program Operations</h3>
                            <div class="operation-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Active Programs</span>
                                    <span class="stat-value">${operations.active_programs}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Field Agents</span>
                                    <span class="stat-value">${operations.field_agents}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Coverage Areas</span>
                                    <span class="stat-value">${operations.coverage_areas}</span>
                                </div>
                            </div>
                        </div>
                        <div class="operation-card">
                            <h3>Operational Metrics</h3>
                            <div class="metric-list">
                                <div class="metric-item">
                                    <span class="metric-label">Efficiency Score</span>
                                    <span class="metric-value">${operations.efficiency_score}%</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Response Time</span>
                                    <span class="metric-value">${operations.response_time} days</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Success Rate</span>
                                    <span class="metric-value">${operations.success_rate}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading operations:', error);
    }
}

// Performance Section
async function loadPerformance() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/manager/performance', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const performance = await response.json();
            const container = document.getElementById('performance');
            if (container) {
                container.innerHTML = `
                    <div class="performance-grid">
                        <div class="performance-card">
                            <h3>Performance Overview</h3>
                            <canvas id="performanceOverviewChart"></canvas>
                        </div>
                        <div class="performance-card">
                            <h3>KPI Tracking</h3>
                            <canvas id="kpiTrackingChart"></canvas>
                        </div>
                    </div>
                `;
                
                // Initialize performance charts
                initializePerformanceCharts(performance);
            }
        }
    } catch (error) {
        console.error('Error loading performance:', error);
    }
}

function initializePerformanceCharts(performance) {
    // Performance overview chart
    const overviewCtx = document.getElementById('performanceOverviewChart');
    if (overviewCtx) {
        new Chart(overviewCtx, {
            type: 'line',
            data: {
                labels: performance.overview.labels,
                datasets: [{
                    label: 'Performance Score',
                    data: performance.overview.data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // KPI tracking chart
    const kpiCtx = document.getElementById('kpiTrackingChart');
    if (kpiCtx) {
        new Chart(kpiCtx, {
            type: 'bar',
            data: {
                labels: performance.kpis.labels,
                datasets: [{
                    label: 'KPI Achievement',
                    data: performance.kpis.data,
                    backgroundColor: '#28a745'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Profile Section
async function loadProfile() {
    try {
        const token = localStorage.getItem('heva_token');
        const tokenParts = token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        
        const response = await fetch(`/api/auth/user/${payload.user_id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            const container = document.getElementById('profile');
            if (container) {
                container.innerHTML = `
                    <div class="profile-section">
                        <div class="profile-card">
                            <div class="profile-avatar">${userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'M'}</div>
                            <div class="profile-details">
                                <h4>${userData.full_name || 'Manager'}</h4>
                                <p><strong>Username:</strong> ${userData.username}</p>
                                <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
                                <p><strong>Role:</strong> ${userData.role}</p>
                                <p><strong>Status:</strong> ${userData.is_active ? 'Active' : 'Inactive'}</p>
                            </div>
                        </div>
                        <div class="profile-actions">
                            <button onclick="editProfile()" class="btn btn-primary">Edit Profile</button>
                            <button onclick="changePassword()" class="btn btn-secondary">Change Password</button>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Modal Functions
function showProgramAnalysisModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Program Analysis</h2>
            <form id="programAnalysisForm">
                <div class="form-group">
                    <label for="programType">Program Type</label>
                    <select id="programType" required>
                        <option value="">Select program type</option>
                        <option value="education">Education</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="livelihood">Livelihood</option>
                        <option value="housing">Housing</option>
                        <option value="financial">Financial</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="analysisPeriod">Analysis Period</label>
                    <select id="analysisPeriod" required>
                        <option value="">Select period</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="analysisMetrics">Analysis Metrics</label>
                    <textarea id="analysisMetrics" rows="3" placeholder="Enter specific metrics to analyze..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Generate Analysis</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Form submission
    modal.querySelector('#programAnalysisForm').onsubmit = async (e) => {
        e.preventDefault();
        await generateProgramAnalysis(modal);
    };
}

function showResourceAllocationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Resource Allocation</h2>
            <form id="resourceAllocationForm">
                <div class="form-group">
                    <label for="totalBudget">Total Budget</label>
                    <input type="number" id="totalBudget" required placeholder="Enter total budget">
                </div>
                <div class="form-group">
                    <label for="allocationStrategy">Allocation Strategy</label>
                    <select id="allocationStrategy" required>
                        <option value="">Select strategy</option>
                        <option value="performance_based">Performance-based</option>
                        <option value="need_based">Need-based</option>
                        <option value="balanced">Balanced</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="priorityAreas">Priority Areas</label>
                    <textarea id="priorityAreas" rows="3" placeholder="Enter priority areas..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Generate Allocation</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Form submission
    modal.querySelector('#resourceAllocationForm').onsubmit = async (e) => {
        e.preventDefault();
        await generateResourceAllocation(modal);
    };
}

function showPerformanceReviewModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Performance Review</h2>
            <form id="performanceReviewForm">
                <div class="form-group">
                    <label for="reviewPeriod">Review Period</label>
                    <select id="reviewPeriod" required>
                        <option value="">Select period</option>
                        <option value="q1">Q1</option>
                        <option value="q2">Q2</option>
                        <option value="q3">Q3</option>
                        <option value="q4">Q4</option>
                        <option value="annual">Annual</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="reviewScope">Review Scope</label>
                    <select id="reviewScope" required>
                        <option value="">Select scope</option>
                        <option value="all_programs">All Programs</option>
                        <option value="specific_program">Specific Program</option>
                        <option value="regional">Regional</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="reviewCriteria">Review Criteria</label>
                    <textarea id="reviewCriteria" rows="3" placeholder="Enter review criteria..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Generate Review</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Form submission
    modal.querySelector('#performanceReviewForm').onsubmit = async (e) => {
        e.preventDefault();
        await generatePerformanceReview(modal);
    };
}

// Report Generation Functions
async function generateStrategicReport() {
    try {
        const token = localStorage.getItem('heva_token');
        showMessage('Generating strategic report...', 'info');
        
        const response = await fetch('/api/manager/report/strategic', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const report = await response.json();
            showReportModal(report, 'Strategic Report');
        } else {
            throw new Error('Failed to generate report');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function generateImpactReport() {
    showMessage('Impact report generation will be implemented', 'info');
}

function generateResourceReport() {
    showMessage('Resource report generation will be implemented', 'info');
}

function generateRiskReport() {
    showMessage('Risk report generation will be implemented', 'info');
}

// Analysis Functions
async function generateProgramAnalysis(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const formData = {
            program_type: document.getElementById('programType').value,
            analysis_period: document.getElementById('analysisPeriod').value,
            analysis_metrics: document.getElementById('analysisMetrics').value
        };
        
        const response = await fetch('/api/manager/analysis/program', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const analysis = await response.json();
            showMessage('Program analysis generated successfully!', 'success');
            modal.remove();
            // Could show results in a new modal or section
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate analysis');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function generateResourceAllocation(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const formData = {
            total_budget: parseFloat(document.getElementById('totalBudget').value),
            allocation_strategy: document.getElementById('allocationStrategy').value,
            priority_areas: document.getElementById('priorityAreas').value
        };
        
        const response = await fetch('/api/manager/allocation/resource', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const allocation = await response.json();
            showMessage('Resource allocation generated successfully!', 'success');
            modal.remove();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate allocation');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function generatePerformanceReview(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const formData = {
            review_period: document.getElementById('reviewPeriod').value,
            review_scope: document.getElementById('reviewScope').value,
            review_criteria: document.getElementById('reviewCriteria').value
        };
        
        const response = await fetch('/api/manager/review/performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const review = await response.json();
            showMessage('Performance review generated successfully!', 'success');
            modal.remove();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate review');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Report Modal
function showReportModal(report, title = 'Report') {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${title}</h2>
            <div class="report-content">
                <div class="report-section">
                    <h3>Summary</h3>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    <p>Total Beneficiaries: ${report.total_beneficiaries || 0}</p>
                    <p>Active Programs: ${report.active_programs || 0}</p>
                    <p>Fund Utilization: ${report.fund_utilization || 0}%</p>
                </div>
                <div class="report-section">
                    <h3>Key Insights</h3>
                    <ul>
                        ${report.insights ? report.insights.map(insight => 
                            `<li>${insight}</li>`
                        ).join('') : '<li>No insights available</li>'}
                    </ul>
                </div>
            </div>
            <button onclick="downloadReport()" class="btn btn-primary">Download PDF</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// PDF Download Functions
async function downloadDashboardReport(userRole) {
    try {
        showMessage('Generating dashboard report...', 'info');
        
        const response = await fetch(`/api/download/dashboard-report/${userRole}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('heva_token')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${userRole}_dashboard_report_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('Dashboard report downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download report');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function downloadBeneficiaryReport() {
    try {
        showMessage('Generating beneficiary report...', 'info');
        
        const response = await fetch('/api/download/beneficiary-report', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('heva_token')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `beneficiary_report_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('Beneficiary report downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download report');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function downloadFundingReport() {
    try {
        showMessage('Generating funding report...', 'info');
        
        const response = await fetch('/api/download/funding-report', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('heva_token')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `funding_report_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('Funding report downloaded successfully!', 'success');
        } else {
            throw new Error('Failed to download report');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function downloadReport() {
    alert('PDF download functionality will be implemented');
}

// Utility Functions
function editProfile() {
    alert('Profile editing functionality will be implemented');
}

function changePassword() {
    alert('Password change functionality will be implemented');
}

// Real-time updates
function startRealTimeUpdates() {
    // Update dashboard every 45 seconds for manager
    setInterval(() => {
        if (document.querySelector('.manager-dashboard')) {
            loadDashboardData();
            loadRealTimeCharts(); // Also refresh charts
        }
    }, 45000);
}

// Enhanced message display
function showMessage(message, type = 'info') {
    const messageBox = document.createElement('div');
    messageBox.className = `alert alert-${type}`;
    messageBox.textContent = message;
    messageBox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 1001;
        max-width: 300px;
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    messageBox.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        messageBox.remove();
    }, 5000);
}

// Funding Management Functions
async function loadFundingData() {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Load funding stats
        const statsResponse = await fetch('/api/manager/funding/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('pendingFunding').textContent = stats.pending_requests;
            document.getElementById('approvedFunding').textContent = stats.approved_today;
            document.getElementById('totalFundsDisbursed').textContent = `$${stats.total_disbursed.toLocaleString()}`;
        }

        // Load funding requests
        const requestsResponse = await fetch('/api/manager/funding/requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (requestsResponse.ok) {
            const requests = await requestsResponse.json();
            updateFundingRequestsTable(requests);
        }

    } catch (error) {
        console.error('Error loading funding data:', error);
        showMessage('Failed to load funding data', 'error');
    }
}

function updateFundingRequestsTable(requests) {
    const tableBody = document.getElementById('fundingRequestsTable');
    if (!tableBody) return;

    tableBody.innerHTML = requests.map(request => `
        <tr>
            <td>${request.name}</td>
            <td>${request.vulnerability_type}</td>
            <td>$${request.funding_amount || 0}</td>
            <td>
                <span class="status-badge ${request.funding_status}">
                    ${request.funding_status}
                </span>
            </td>
            <td>${request.registration_date ? new Date(request.registration_date).toLocaleDateString() : 'N/A'}</td>
            <td>
                ${request.funding_status === 'pending' ? `
                    <button class="btn-approve" onclick="approveFunding(${request.beneficiary_id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-decline" onclick="declineFunding(${request.beneficiary_id})">
                        <i class="fas fa-times"></i> Decline
                    </button>
                ` : `
                    <span class="text-muted">${request.funding_status === 'approved' ? 'Approved' : 'Declined'}</span>
                `}
            </td>
        </tr>
    `).join('');
}

async function approveFunding(beneficiaryId) {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const notes = prompt('Enter approval notes (optional):');
        
        const response = await fetch(`/api/manager/funding/approve/${beneficiaryId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes: notes || '' })
        });

        if (response.ok) {
            showMessage('Funding approved successfully', 'success');
            loadFundingData(); // Refresh the data
        } else {
            const error = await response.json();
            showMessage(error.error || 'Failed to approve funding', 'error');
        }

    } catch (error) {
        console.error('Error approving funding:', error);
        showMessage('Failed to approve funding', 'error');
    }
}

async function declineFunding(beneficiaryId) {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const notes = prompt('Enter decline reason (optional):');
        
        const response = await fetch(`/api/manager/funding/decline/${beneficiaryId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes: notes || '' })
        });

        if (response.ok) {
            showMessage('Funding declined successfully', 'success');
            loadFundingData(); // Refresh the data
        } else {
            const error = await response.json();
            showMessage(error.error || 'Failed to decline funding', 'error');
        }

    } catch (error) {
        console.error('Error declining funding:', error);
        showMessage('Failed to decline funding', 'error');
    }
}

async function approveAllPendingFunding() {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const notes = prompt('Enter notes for bulk approval (optional):');
        
        const response = await fetch('/api/manager/funding/approve-all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes: notes || 'Bulk approval' })
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message, 'success');
            loadFundingData(); // Refresh the data
        } else {
            const error = await response.json();
            showMessage(error.error || 'Failed to approve all funding', 'error');
        }

    } catch (error) {
        console.error('Error approving all funding:', error);
        showMessage('Failed to approve all funding', 'error');
    }
}

async function generateFundingReport() {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        showMessage('Generating funding report...', 'info');
        
        const response = await fetch('/api/download/funding-report', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `funding_report_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('Funding report downloaded successfully', 'success');
        } else {
            const error = await response.json();
            showMessage(error.error || 'Failed to generate funding report', 'error');
        }

    } catch (error) {
        console.error('Error generating funding report:', error);
        showMessage('Failed to generate funding report', 'error');
    }
}

function showFundingAnalytics() {
    // Show funding analytics modal or navigate to analytics section
    showMessage('Funding analytics feature coming soon', 'info');
} 