// Analyst Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    if (document.querySelector('.analyst-dashboard')) {
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
        document.getElementById('generateReportBtn').addEventListener('click', function() {
            generateComprehensiveReport();
        });

        document.getElementById('exportDataBtn').addEventListener('click', function() {
            exportData();
        });

        document.getElementById('createAnalysisBtn').addEventListener('click', function() {
            showAnalysisModal();
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

        // Fetch analyst dashboard data
        const response = await fetch('/api/analyst/dashboard', {
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
        document.getElementById('totalAssessments').textContent = data.total_assessments;
        document.getElementById('highRiskCases').textContent = data.high_risk_cases;
        document.getElementById('avgVulnerabilityScore').textContent = data.avg_vulnerability_score;

        // Update charts with real data
        updateCharts(data);

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
        const response = await fetch('/api/analyst/charts/real-time', {
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
    // Update vulnerability distribution chart
    if (vulnerabilityChart && chartData.vulnerability_distribution) {
        vulnerabilityChart.data.labels = chartData.vulnerability_distribution.labels;
        vulnerabilityChart.data.datasets[0].data = chartData.vulnerability_distribution.data;
        vulnerabilityChart.update();
    }

    // Update geographic distribution chart
    if (geographicChart && chartData.geographic_distribution) {
        geographicChart.data.labels = chartData.geographic_distribution.labels;
        geographicChart.data.datasets[0].data = chartData.geographic_distribution.data;
        geographicChart.update();
    }

    // Update age distribution chart
    if (ageChart && chartData.age_distribution) {
        ageChart.data.datasets[0].data = chartData.age_distribution;
        ageChart.update();
    }

    // Update assessment scores chart
    if (assessmentChart && chartData.assessment_scores) {
        assessmentChart.data.datasets[0].data = chartData.assessment_scores;
        assessmentChart.update();
    }

    // Update monthly trends chart
    if (trendsChart && chartData.monthly_trends) {
        trendsChart.data.labels = chartData.monthly_trends.labels;
        trendsChart.data.datasets[0].data = chartData.monthly_trends.beneficiaries;
        trendsChart.data.datasets[1].data = chartData.monthly_trends.assessments;
        trendsChart.data.datasets[2].data = chartData.monthly_trends.vulnerability_scores;
        trendsChart.update();
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
                full_name: payload.full_name || 'Analyst',
                role: payload.role || 'analyst'
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        updateUserUI({
            full_name: 'Analyst',
            role: 'analyst'
        });
    }
}

function updateUserUI(userData) {
    const avatar = document.getElementById('userAvatar');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userRole = document.getElementById('userRole');
    
    if (avatar) {
        avatar.textContent = userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'A';
    }
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${userData.full_name || 'Analyst'}`;
    }
    
    if (userRole) {
        userRole.textContent = `Data Analyst | ${userData.location || 'System'}`;
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
            case 'analytics':
                loadAnalytics();
                break;
            case 'reports':
                loadReports();
                break;
            case 'beneficiaries':
                loadBeneficiaries();
                break;
            case 'trends':
                loadTrends();
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
let vulnerabilityChart, trendsChart;

function initializeCharts() {
    // Initialize vulnerability distribution chart
    const vulnerabilityCtx = document.getElementById('vulnerabilityChart');
    if (vulnerabilityCtx) {
        vulnerabilityChart = new Chart(vulnerabilityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Poverty', 'Refugee', 'Disability', 'LGBTQI+', 'Low Literacy', 'Other'],
                datasets: [{
                    data: [30, 20, 15, 10, 15, 10],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
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

    // Initialize trends chart
    const trendsCtx = document.getElementById('trendsChart');
    if (trendsCtx) {
        trendsChart = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'New Beneficiaries',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Assessments',
                    data: [28, 48, 40, 19, 86, 27],
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

function updateCharts(data) {
    // Update vulnerability chart
    if (vulnerabilityChart && data.vulnerability_distribution) {
        vulnerabilityChart.data.datasets[0].data = Object.values(data.vulnerability_distribution);
        vulnerabilityChart.update();
    }

    // Update trends chart
    if (trendsChart && data.monthly_trends) {
        trendsChart.data.labels = data.monthly_trends.labels;
        trendsChart.data.datasets[0].data = data.monthly_trends.beneficiaries;
        trendsChart.data.datasets[1].data = data.monthly_trends.assessments;
        trendsChart.update();
    }
}

// Analytics Section
async function loadAnalytics() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/analyst/analytics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const analytics = await response.json();
            const container = document.getElementById('analytics');
            if (container) {
                container.innerHTML = `
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <h3>Geographic Distribution</h3>
                            <canvas id="geoChart"></canvas>
                        </div>
                        <div class="analytics-card">
                            <h3>Risk Assessment Trends</h3>
                            <canvas id="riskChart"></canvas>
                        </div>
                        <div class="analytics-card">
                            <h3>Age Distribution</h3>
                            <canvas id="ageChart"></canvas>
                        </div>
                        <div class="analytics-card">
                            <h3>Assessment Scores</h3>
                            <canvas id="scoreChart"></canvas>
                        </div>
                    </div>
                `;
                
                // Initialize analytics charts
                initializeAnalyticsCharts(analytics);
            }
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function initializeAnalyticsCharts(analytics) {
    // Geographic distribution chart
    const geoCtx = document.getElementById('geoChart');
    if (geoCtx) {
        new Chart(geoCtx, {
            type: 'bar',
            data: {
                labels: analytics.geographic_distribution.labels,
                datasets: [{
                    label: 'Beneficiaries',
                    data: analytics.geographic_distribution.data,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Risk assessment chart
    const riskCtx = document.getElementById('riskChart');
    if (riskCtx) {
        new Chart(riskCtx, {
            type: 'line',
            data: {
                labels: analytics.risk_trends.labels,
                datasets: [{
                    label: 'High Risk Cases',
                    data: analytics.risk_trends.data,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Age distribution chart
    const ageCtx = document.getElementById('ageChart');
    if (ageCtx) {
        new Chart(ageCtx, {
            type: 'pie',
            data: {
                labels: ['0-18', '19-30', '31-50', '51+'],
                datasets: [{
                    data: analytics.age_distribution,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Assessment scores chart
    const scoreCtx = document.getElementById('scoreChart');
    if (scoreCtx) {
        new Chart(scoreCtx, {
            type: 'radar',
            data: {
                labels: ['Poverty', 'Literacy', 'Digital Access', 'Disability', 'LGBTQI+'],
                datasets: [{
                    label: 'Average Scores',
                    data: analytics.assessment_scores,
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
                        max: 5
                    }
                }
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
                    <button onclick="downloadDashboardReport('analyst')" class="btn btn-primary">Download PDF</button>
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
                    <h4>Monthly Summary Report</h4>
                    <p>Comprehensive monthly analysis of all beneficiary data and trends</p>
                    <button onclick="generateMonthlyReport()" class="btn btn-primary">Generate</button>
                </div>
            </div>
        `;
    }
}

// Beneficiaries Section
async function loadBeneficiaries() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/beneficiaries/beneficiaries', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('beneficiaries');
            if (container) {
                container.innerHTML = `
                    <div class="beneficiaries-table">
                        <div class="table-header">
                            <h3>Beneficiary Analysis (${data.total})</h3>
                        </div>
                        <div class="table-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Vulnerability Type</th>
                                        <th>Age</th>
                                        <th>Location</th>
                                        <th>Risk Level</th>
                                        <th>Last Assessment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.items.map(beneficiary => `
                                        <tr>
                                            <td>${beneficiary.name}</td>
                                            <td>${beneficiary.vulnerability_type}</td>
                                            <td>${beneficiary.age || 'N/A'}</td>
                                            <td>${beneficiary.location || 'N/A'}</td>
                                            <td>${beneficiary.is_high_risk ? 'High' : 'Low'}</td>
                                            <td>${beneficiary.last_assessment || 'N/A'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading beneficiaries:', error);
    }
}

// Trends Section
async function loadTrends() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/analyst/trends', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const trends = await response.json();
            const container = document.getElementById('trends');
            if (container) {
                container.innerHTML = `
                    <div class="trends-container">
                        <div class="trend-card">
                            <h3>Monthly Growth Trends</h3>
                            <canvas id="growthChart"></canvas>
                        </div>
                        <div class="trend-card">
                            <h3>Vulnerability Score Trends</h3>
                            <canvas id="vulnerabilityTrendChart"></canvas>
                        </div>
                    </div>
                `;
                
                // Initialize trend charts
                initializeTrendCharts(trends);
            }
        }
    } catch (error) {
        console.error('Error loading trends:', error);
    }
}

function initializeTrendCharts(trends) {
    // Growth chart
    const growthCtx = document.getElementById('growthChart');
    if (growthCtx) {
        new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: trends.growth.labels,
                datasets: [{
                    label: 'New Beneficiaries',
                    data: trends.growth.data,
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

    // Vulnerability trend chart
    const vulnCtx = document.getElementById('vulnerabilityTrendChart');
    if (vulnCtx) {
        new Chart(vulnCtx, {
            type: 'line',
            data: {
                labels: trends.vulnerability.labels,
                datasets: [{
                    label: 'Average Vulnerability Score',
                    data: trends.vulnerability.data,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
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
                            <div class="profile-avatar">${userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'A'}</div>
                            <div class="profile-details">
                                <h4>${userData.full_name || 'Analyst'}</h4>
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

// Report Generation Functions
async function generateComprehensiveReport() {
    try {
        const token = localStorage.getItem('heva_token');
        showMessage('Generating comprehensive report...', 'info');
        
        const response = await fetch('/api/analyst/report/comprehensive', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const report = await response.json();
            showReportModal(report, 'Comprehensive Analysis Report');
        } else {
            throw new Error('Failed to generate report');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function generateMonthlyReport() {
    showMessage('Monthly report generation will be implemented', 'info');
}

function generateRiskReport() {
    showMessage('Risk report generation will be implemented', 'info');
}

function generateGeoReport() {
    showMessage('Geographic report generation will be implemented', 'info');
}

function generateTrendReport() {
    showMessage('Trend report generation will be implemented', 'info');
}

// Data Export
async function exportData() {
    try {
        const token = localStorage.getItem('heva_token');
        showMessage('Exporting data...', 'info');
        
        const response = await fetch('/api/analyst/export', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'heva_data_export.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showMessage('Data exported successfully!', 'success');
        } else {
            throw new Error('Failed to export data');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Analysis Modal
function showAnalysisModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Create Custom Analysis</h2>
            <form id="analysisForm">
                <div class="form-group">
                    <label for="analysisType">Analysis Type</label>
                    <select id="analysisType" required>
                        <option value="">Select analysis type</option>
                        <option value="vulnerability">Vulnerability Analysis</option>
                        <option value="geographic">Geographic Analysis</option>
                        <option value="trend">Trend Analysis</option>
                        <option value="risk">Risk Assessment</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="dateRange">Date Range</label>
                    <select id="dateRange" required>
                        <option value="">Select date range</option>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="filters">Additional Filters</label>
                    <textarea id="filters" rows="3" placeholder="Enter any additional filters..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Create Analysis</button>
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
    modal.querySelector('#analysisForm').onsubmit = async (e) => {
        e.preventDefault();
        await createCustomAnalysis(modal);
    };
}

async function createCustomAnalysis(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const formData = {
            analysis_type: document.getElementById('analysisType').value,
            date_range: document.getElementById('dateRange').value,
            filters: document.getElementById('filters').value
        };
        
        const response = await fetch('/api/analyst/analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const analysis = await response.json();
            showMessage('Analysis created successfully!', 'success');
            modal.remove();
            // Could show results in a new modal or section
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create analysis');
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
                    <p>Total Beneficiaries: ${report.total_beneficiaries}</p>
                    <p>Total Assessments: ${report.total_assessments}</p>
                    <p>High Risk Cases: ${report.high_risk_cases}</p>
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
    // Update dashboard every 60 seconds for analyst
    setInterval(() => {
        if (document.querySelector('.analyst-dashboard')) {
            loadDashboardData();
            loadRealTimeCharts(); // Also refresh charts
        }
    }, 60000);
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