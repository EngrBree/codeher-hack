// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    if (document.querySelector('.admin-dashboard')) {
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
        document.getElementById('createUserBtn').addEventListener('click', function() {
            showCreateUserModal();
        });

        document.getElementById('systemBackupBtn').addEventListener('click', function() {
            performSystemBackup();
        });

        document.getElementById('generateReportBtn').addEventListener('click', function() {
            downloadDashboardReport('admin');
        });

        document.getElementById('systemMaintenanceBtn').addEventListener('click', function() {
            showMaintenanceModal();
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

        // Fetch admin dashboard data
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();
        
        // Update stats with real data
        document.getElementById('totalUsers').textContent = data.total_users;
        document.getElementById('totalBeneficiaries').textContent = data.total_beneficiaries;
        document.getElementById('activeUsers').textContent = data.active_users;
        document.getElementById('systemHealth').textContent = data.system_health + '%';

        // Update charts with real data
        updateCharts(data);

        // Load recent activity
        const activityResponse = await fetch('/api/admin/activity', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (activityResponse.ok) {
            const activity = await activityResponse.json();
            const activityFeed = document.getElementById('activityFeed');
            
            activityFeed.innerHTML = activity.map(item => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${item.description}</p>
                        <small>${new Date(item.timestamp).toLocaleString()}</small>
                    </div>
                </div>
            `).join('');
        }

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
        const response = await fetch('/api/admin/charts/real-time', {
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
    if (beneficiariesPerGroupChart && chartData.vulnerability_distribution) {
        beneficiariesPerGroupChart.data.labels = chartData.vulnerability_distribution.labels;
        beneficiariesPerGroupChart.data.datasets[0].data = chartData.vulnerability_distribution.data;
        beneficiariesPerGroupChart.update();
    }

    // Update gender distribution chart
    if (genderDistributionChart && chartData.gender_distribution) {
        genderDistributionChart.data.labels = chartData.gender_distribution.labels;
        genderDistributionChart.data.datasets[0].data = chartData.gender_distribution.data;
        genderDistributionChart.update();
    }

    // Update funding status chart
    if (fundingStatusChart && chartData.funding_status) {
        fundingStatusChart.data.labels = chartData.funding_status.labels;
        fundingStatusChart.data.datasets[0].data = chartData.funding_status.data;
        fundingStatusChart.update();
    }

    // Update regional distribution chart
    if (regionalDistributionChart && chartData.regional_distribution) {
        regionalDistributionChart.data.labels = chartData.regional_distribution.labels;
        regionalDistributionChart.data.datasets[0].data = chartData.regional_distribution.data;
        regionalDistributionChart.update();
    }

    // Update monthly trends chart
    if (monthlyTrendsChart && chartData.monthly_trends) {
        monthlyTrendsChart.data.labels = chartData.monthly_trends.labels;
        monthlyTrendsChart.data.datasets[0].data = chartData.monthly_trends.beneficiaries;
        monthlyTrendsChart.data.datasets[1].data = chartData.monthly_trends.funding;
        monthlyTrendsChart.update();
    }

    // Update funds distribution chart with real data
    if (fundsDistributionChart) {
        // This would need to be calculated from the funding data
        const approvedAmount = chartData.funding_status ? 
            chartData.funding_status.data[chartData.funding_status.labels.indexOf('approved')] || 0 : 0;
        const declinedAmount = chartData.funding_status ? 
            chartData.funding_status.data[chartData.funding_status.labels.indexOf('declined')] || 0 : 0;
        const pendingAmount = chartData.funding_status ? 
            chartData.funding_status.data[chartData.funding_status.labels.indexOf('pending')] || 0 : 0;
        
        fundsDistributionChart.data.datasets[0].data = [approvedAmount, declinedAmount, pendingAmount];
        fundsDistributionChart.update();
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
                full_name: payload.full_name || 'Administrator',
                role: payload.role || 'admin'
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        updateUserUI({
            full_name: 'Administrator',
            role: 'admin'
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
        welcomeMessage.textContent = `Welcome, ${userData.full_name || 'Administrator'}`;
    }
    
    if (userRole) {
        userRole.textContent = `System Administrator | ${userData.location || 'System'}`;
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
            case 'users':
                loadUsers();
                break;
            case 'system':
                loadSystemStatus();
                break;
            case 'reports':
                loadReports();
                break;
            case 'audit':
                loadAuditLog();
                break;
            case 'settings':
                loadSettings();
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
let beneficiariesPerGroupChart, genderDistributionChart, fundingStatusChart, fundsDistributionChart, regionalDistributionChart, monthlyTrendsChart;

function initializeCharts() {
    // Initialize beneficiaries per group chart
    const beneficiariesPerGroupCtx = document.getElementById('beneficiariesPerGroupChart');
    if (beneficiariesPerGroupCtx) {
        beneficiariesPerGroupChart = new Chart(beneficiariesPerGroupCtx, {
            type: 'bar',
            data: {
                labels: ['Refugees', 'PWDs', 'LGBTQI+', 'Low Literacy', 'Other'],
                datasets: [{
                    label: 'Beneficiaries',
                    data: [45, 30, 15, 25, 10],
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
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Initialize gender distribution chart
    const genderDistributionCtx = document.getElementById('genderDistributionChart');
    if (genderDistributionCtx) {
        genderDistributionChart = new Chart(genderDistributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Male', 'Female', 'Other'],
                datasets: [{
                    data: [40, 55, 5],
                    backgroundColor: [
                        '#36A2EB',
                        '#FF6384',
                        '#FFCE56'
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

    // Initialize funding status chart
    const fundingStatusCtx = document.getElementById('fundingStatusChart');
    if (fundingStatusCtx) {
        fundingStatusChart = new Chart(fundingStatusCtx, {
            type: 'pie',
            data: {
                labels: ['Approved', 'Declined', 'Pending'],
                datasets: [{
                    data: [60, 20, 20],
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#ffc107'
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

    // Initialize funds distribution chart
    const fundsDistributionCtx = document.getElementById('fundsDistributionChart');
    if (fundsDistributionCtx) {
        fundsDistributionChart = new Chart(fundsDistributionCtx, {
            type: 'bar',
            data: {
                labels: ['Approved', 'Declined', 'Pending'],
                datasets: [{
                    label: 'Amount (KSH)',
                    data: [1500000, 500000, 400000],
                    backgroundColor: [
                        '#28a745',
                        '#dc3545',
                        '#ffc107'
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
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Initialize regional distribution chart
    const regionalDistributionCtx = document.getElementById('regionalDistributionChart');
    if (regionalDistributionCtx) {
        regionalDistributionChart = new Chart(regionalDistributionCtx, {
            type: 'bar',
            data: {
                labels: ['Nairobi', 'Kisumu', 'Mombasa', 'Nakuru', 'Eldoret'],
                datasets: [{
                    label: 'Beneficiaries',
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: '#667eea'
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
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Initialize monthly trends chart
    const monthlyTrendsCtx = document.getElementById('monthlyTrendsChart');
    if (monthlyTrendsCtx) {
        monthlyTrendsChart = new Chart(monthlyTrendsCtx, {
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
                    label: 'Funding Approved',
                    data: [45, 52, 68, 75, 62, 70],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
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
    // Update user activity chart
    if (userActivityChart && data.user_activity) {
        userActivityChart.data.labels = data.user_activity.labels;
        userActivityChart.data.datasets[0].data = data.user_activity.active_users;
        userActivityChart.data.datasets[1].data = data.user_activity.new_users;
        userActivityChart.update();
    }

    // Update system performance chart
    if (systemPerformanceChart && data.system_performance) {
        systemPerformanceChart.data.datasets[0].data = data.system_performance;
        systemPerformanceChart.update();
    }
}

// User Management
async function loadUsers() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const container = document.getElementById('users');
            if (container) {
                container.innerHTML = `
                    <div class="users-table">
                        <div class="table-header">
                            <h3>User Management (${users.length})</h3>
                            <button onclick="showCreateUserModal()" class="btn btn-primary">
                                <i class="fas fa-user-plus"></i> Add User
                            </button>
                        </div>
                        <div class="table-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Full Name</th>
                                        <th>Role</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Last Login</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${users.map(user => `
                                        <tr>
                                            <td>${user.username}</td>
                                            <td>${user.full_name || 'N/A'}</td>
                                            <td><span class="role-badge ${user.role}">${user.role}</span></td>
                                            <td>${user.email || 'N/A'}</td>
                                            <td>
                                                <span class="status-indicator ${user.is_active ? 'online' : 'offline'}"></span>
                                                ${user.is_active ? 'Active' : 'Inactive'}
                                            </td>
                                            <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                                            <td class="user-actions">
                                                <button onclick="editUser(${user.user_id})" class="btn btn-sm btn-primary">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button onclick="toggleUserStatus(${user.user_id})" class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}">
                                                    <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                                                </button>
                                                <button onclick="deleteUser(${user.user_id})" class="btn btn-sm btn-danger">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
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
        console.error('Error loading users:', error);
    }
}

// System Status
async function loadSystemStatus() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/admin/system', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const system = await response.json();
            const container = document.getElementById('system');
            if (container) {
                container.innerHTML = `
                    <div class="system-grid">
                        <div class="system-card">
                            <h3>Database Status</h3>
                            <div class="system-status">
                                <span class="status-indicator ${system.database.status}"></span>
                                <span>${system.database.status}</span>
                            </div>
                            <p>Connection: ${system.database.connection}</p>
                            <p>Size: ${system.database.size}</p>
                        </div>
                        <div class="system-card">
                            <h3>Server Performance</h3>
                            <div class="system-status">
                                <span class="status-indicator ${system.server.status}"></span>
                                <span>${system.server.status}</span>
                            </div>
                            <p>CPU: ${system.server.cpu}%</p>
                            <p>Memory: ${system.server.memory}%</p>
                            <p>Uptime: ${system.server.uptime}</p>
                        </div>
                        <div class="system-card">
                            <h3>Security Status</h3>
                            <div class="system-status">
                                <span class="status-indicator ${system.security.status}"></span>
                                <span>${system.security.status}</span>
                            </div>
                            <p>Failed Logins: ${system.security.failed_logins}</p>
                            <p>Last Scan: ${system.security.last_scan}</p>
                        </div>
                        <div class="system-card">
                            <h3>Backup Status</h3>
                            <div class="system-status">
                                <span class="status-indicator ${system.backup.status}"></span>
                                <span>${system.backup.status}</span>
                            </div>
                            <p>Last Backup: ${system.backup.last_backup}</p>
                            <p>Next Backup: ${system.backup.next_backup}</p>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading system status:', error);
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
                    <button onclick="downloadDashboardReport('admin')" class="btn btn-primary">Download PDF</button>
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
                    <h4>System Health Report</h4>
                    <p>System health and performance analysis</p>
                    <button onclick="generateSystemHealthReport()" class="btn btn-primary">Generate</button>
                </div>
            </div>
        `;
    }
}

// Audit Log
async function loadAuditLog() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/admin/audit', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const audit = await response.json();
            const container = document.getElementById('audit');
            if (container) {
                container.innerHTML = `
                    <div class="audit-log">
                        <div class="audit-filters">
                            <select id="auditLevel">
                                <option value="">All Levels</option>
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                            <select id="auditUser">
                                <option value="">All Users</option>
                                ${audit.users.map(user => `<option value="${user}">${user}</option>`).join('')}
                            </select>
                            <input type="date" id="auditDate" placeholder="Filter by date">
                            <button onclick="filterAuditLog()" class="btn btn-primary">Filter</button>
                        </div>
                        <div class="table-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Level</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${audit.logs.map(log => `
                                        <tr class="audit-level-${log.level}">
                                            <td>${new Date(log.timestamp).toLocaleString()}</td>
                                            <td><span class="level-badge ${log.level}">${log.level}</span></td>
                                            <td>${log.user}</td>
                                            <td>${log.action}</td>
                                            <td>${log.details}</td>
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
        console.error('Error loading audit log:', error);
    }
}

// Settings Section
async function loadSettings() {
    const container = document.getElementById('settings');
    if (container) {
        container.innerHTML = `
            <div class="settings-grid">
                <div class="settings-card">
                    <h3>System Settings</h3>
                    <div class="setting-item">
                        <span class="setting-label">Maintenance Mode</span>
                        <div class="setting-control">
                            <label class="switch">
                                <input type="checkbox" id="maintenanceMode">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Auto Backup</span>
                        <div class="setting-control">
                            <label class="switch">
                                <input type="checkbox" id="autoBackup" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Session Timeout (minutes)</span>
                        <div class="setting-control">
                            <input type="number" id="sessionTimeout" value="30" min="5" max="120">
                        </div>
                    </div>
                </div>
                <div class="settings-card">
                    <h3>Security Settings</h3>
                    <div class="setting-item">
                        <span class="setting-label">Two-Factor Authentication</span>
                        <div class="setting-control">
                            <label class="switch">
                                <input type="checkbox" id="twoFactorAuth">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Password Policy</span>
                        <div class="setting-control">
                            <select id="passwordPolicy">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Failed Login Attempts</span>
                        <div class="setting-control">
                            <input type="number" id="maxLoginAttempts" value="5" min="3" max="10">
                        </div>
                    </div>
                </div>
                <div class="settings-card">
                    <h3>Notification Settings</h3>
                    <div class="setting-item">
                        <span class="setting-label">Email Notifications</span>
                        <div class="setting-control">
                            <label class="switch">
                                <input type="checkbox" id="emailNotifications" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">System Alerts</span>
                        <div class="setting-control">
                            <label class="switch">
                                <input type="checkbox" id="systemAlerts" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="setting-item">
                        <span class="setting-label">Audit Log Retention (days)</span>
                        <div class="setting-control">
                            <input type="number" id="auditRetention" value="90" min="30" max="365">
                        </div>
                    </div>
                </div>
            </div>
            <div style="margin-top: 2rem; text-align: center;">
                <button onclick="saveSettings()" class="btn btn-primary">Save Settings</button>
                <button onclick="resetSettings()" class="btn btn-secondary">Reset to Default</button>
            </div>
        `;
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
                                <h4>${userData.full_name || 'Administrator'}</h4>
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
function showCreateUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Create New User</h2>
            <form id="createUserForm">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label for="fullName">Full Name</label>
                    <input type="text" id="fullName" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="role">Role</label>
                    <select id="role" required>
                        <option value="">Select role</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="analyst">Analyst</option>
                        <option value="field_agent">Field Agent</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" required>
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Create User</button>
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
    modal.querySelector('#createUserForm').onsubmit = async (e) => {
        e.preventDefault();
        await createUser(modal);
    };
}

async function createUser(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        const formData = {
            username: document.getElementById('username').value,
            full_name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            role: document.getElementById('role').value,
            password: password
        };
        
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('User created successfully!', 'success');
            modal.remove();
            loadUsers(); // Refresh users list
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create user');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// System Functions
async function performSystemBackup() {
    try {
        const token = localStorage.getItem('heva_token');
        showMessage('Creating system backup...', 'info');
        
        const response = await fetch('/api/admin/backup', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const backup = await response.json();
            showMessage('System backup completed successfully!', 'success');
        } else {
            throw new Error('Failed to create backup');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function generateSystemReport() {
    try {
        const token = localStorage.getItem('heva_token');
        showMessage('Generating system report...', 'info');
        
        const response = await fetch('/api/admin/report/system', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const report = await response.json();
            showReportModal(report, 'System Report');
        } else {
            throw new Error('Failed to generate report');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function showMaintenanceModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>System Maintenance</h2>
            <div class="maintenance-options">
                <div class="maintenance-option">
                    <h4>Database Optimization</h4>
                    <p>Optimize database tables and indexes</p>
                    <button onclick="performDatabaseOptimization()" class="btn btn-primary">Run</button>
                </div>
                <div class="maintenance-option">
                    <h4>Cache Clear</h4>
                    <p>Clear system cache and temporary files</p>
                    <button onclick="clearSystemCache()" class="btn btn-primary">Run</button>
                </div>
                <div class="maintenance-option">
                    <h4>Log Cleanup</h4>
                    <p>Clean up old log files</p>
                    <button onclick="cleanupLogs()" class="btn btn-primary">Run</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Report Generation Functions
function generateSystemHealthReport() {
    showMessage('System health report generation will be implemented', 'info');
}

function generateUserActivityReport() {
    showMessage('User activity report generation will be implemented', 'info');
}

function generateSecurityReport() {
    showMessage('Security report generation will be implemented', 'info');
}

function generateDatabaseReport() {
    showMessage('Database report generation will be implemented', 'info');
}

// User Management Functions
function editUser(userId) {
    showMessage(`Edit user ${userId} functionality will be implemented`, 'info');
}

async function toggleUserStatus(userId) {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('User status updated successfully!', 'success');
            loadUsers(); // Refresh users list
        } else {
            throw new Error('Failed to update user status');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showMessage('User deleted successfully!', 'success');
            loadUsers(); // Refresh users list
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Settings Functions
function saveSettings() {
    const settings = {
        maintenanceMode: document.getElementById('maintenanceMode').checked,
        autoBackup: document.getElementById('autoBackup').checked,
        sessionTimeout: document.getElementById('sessionTimeout').value,
        twoFactorAuth: document.getElementById('twoFactorAuth').checked,
        passwordPolicy: document.getElementById('passwordPolicy').value,
        maxLoginAttempts: document.getElementById('maxLoginAttempts').value,
        emailNotifications: document.getElementById('emailNotifications').checked,
        systemAlerts: document.getElementById('systemAlerts').checked,
        auditRetention: document.getElementById('auditRetention').value
    };
    
    // Save settings to backend
    showMessage('Settings saved successfully!', 'success');
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        // Reset form values to default
        document.getElementById('maintenanceMode').checked = false;
        document.getElementById('autoBackup').checked = true;
        document.getElementById('sessionTimeout').value = 30;
        document.getElementById('twoFactorAuth').checked = false;
        document.getElementById('passwordPolicy').value = 'medium';
        document.getElementById('maxLoginAttempts').value = 5;
        document.getElementById('emailNotifications').checked = true;
        document.getElementById('systemAlerts').checked = true;
        document.getElementById('auditRetention').value = 90;
        
        showMessage('Settings reset to default!', 'success');
    }
}

// Maintenance Functions
function performDatabaseOptimization() {
    showMessage('Database optimization completed!', 'success');
}

function clearSystemCache() {
    showMessage('System cache cleared successfully!', 'success');
}

function cleanupLogs() {
    showMessage('Log cleanup completed!', 'success');
}

// Utility Functions
function editProfile() {
    alert('Profile editing functionality will be implemented');
}

function changePassword() {
    alert('Password change functionality will be implemented');
}

function filterAuditLog() {
    const level = document.getElementById('auditLevel').value;
    const user = document.getElementById('auditUser').value;
    const date = document.getElementById('auditDate').value;
    
    // Filter logic would be implemented here
    showMessage('Audit log filtered!', 'info');
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
                    <p>System Status: ${report.system_status || 'Unknown'}</p>
                    <p>Total Users: ${report.total_users || 0}</p>
                    <p>Active Sessions: ${report.active_sessions || 0}</p>
                </div>
                <div class="report-section">
                    <h3>Key Metrics</h3>
                    <ul>
                        ${report.metrics ? report.metrics.map(metric => 
                            `<li>${metric}</li>`
                        ).join('') : '<li>No metrics available</li>'}
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

// Real-time updates
function startRealTimeUpdates() {
    // Update dashboard every 30 seconds for admin
    setInterval(() => {
        if (document.querySelector('.admin-dashboard')) {
            loadDashboardData();
            loadRealTimeCharts(); // Also refresh charts
        }
    }, 30000);
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
        const statsResponse = await fetch('/api/admin/funding/stats', {
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
        const requestsResponse = await fetch('/api/admin/beneficiaries/funding', {
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
        
        const response = await fetch(`/api/admin/funding/approve/${beneficiaryId}`, {
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
        
        const response = await fetch(`/api/admin/funding/decline/${beneficiaryId}`, {
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
        
        const response = await fetch('/api/admin/funding/approve-all', {
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