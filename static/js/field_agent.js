// Registration Form Handling
document.addEventListener('DOMContentLoaded', function() {
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strengthIndicator = this.parentElement.querySelector('.password-strength');
            const strength = calculatePasswordStrength(this.value);
            
            strengthIndicator.style.width = `${strength.score * 25}%`;
            strengthIndicator.style.background = strength.color;
        });
    }

    // Registration form submission
    const registerForm = document.getElementById('fieldAgentRegisterForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                username: document.getElementById('username').value,
                password: document.getElementById('password').value,
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                county: document.getElementById('county').value,
                role: 'field_agent'
            };

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                showMessage('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
    }

    // Dashboard functionality
    if (document.querySelector('.field-agent-dashboard')) {
        // Load dashboard data
        loadDashboardData();
        
        // Start real-time updates
        startRealTimeUpdates();
        
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
        document.getElementById('newBeneficiaryBtn').addEventListener('click', function() {
            showBeneficiaryModal();
        });

        document.getElementById('newAssessmentBtn').addEventListener('click', function() {
            showAssessmentModal();
        });

        document.getElementById('generateReportBtn').addEventListener('click', function() {
            generateReport();
        });

        // Funding tracking buttons
        const requestFundingBtn = document.getElementById('requestFundingBtn');
        if (requestFundingBtn) {
            requestFundingBtn.addEventListener('click', function() {
                showRequestFundingModal();
            });
        }

        const generateFundingReportBtn = document.getElementById('generateFundingReportBtn');
        if (generateFundingReportBtn) {
            generateFundingReportBtn.addEventListener('click', function() {
                generateFundingReport();
            });
        }

        const viewFundingReportBtn = document.getElementById('viewFundingReportBtn');
        if (viewFundingReportBtn) {
            viewFundingReportBtn.addEventListener('click', function() {
                showFundingReportModal();
            });
        }
    }
});

function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^A-Za-z0-9]/)) score++;

    const colors = ['#e74c3c', '#f39c12', '#3498db', '#2ecc71'];
    return {
        score: score,
        color: colors[Math.min(score, colors.length - 1)]
    };
}

function showMessage(message, type) {
    const messageBox = document.getElementById('registrationMessage');
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    messageBox.style.background = type === 'error' ? '#f8d7da' : '#d4edda';
    messageBox.style.color = type === 'error' ? '#721c24' : '#155724';
    messageBox.style.border = type === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Load user data first
        await loadUserData(token);

        // Fetch dashboard stats
        const statsResponse = await fetch('/api/field_agent/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!statsResponse.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const stats = await statsResponse.json();
        
        // Update UI with real-time data
        document.getElementById('totalBeneficiaries').textContent = stats.total_beneficiaries || 0;
        document.getElementById('assessmentsThisMonth').textContent = stats.assessments_this_month || 0;
        document.getElementById('highRiskCases').textContent = stats.high_risk_cases || 0;

        // Update gender and region charts if they exist
        updateGenderChart(stats.gender_distribution || {});
        updateRegionChart(stats.region_distribution || {});
        updateVulnerabilityChart(stats.vulnerability_distribution || {});

        // Load recent activity
        const activityResponse = await fetch('/api/field_agent/activity', {
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
    }
}

async function loadUserData(token) {
    try {
        // Decode the JWT token to get user info
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload.user_id;
        
        // Fetch user details from the API
        const userResponse = await fetch(`/api/auth/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            updateUserUI(userData);
        } else {
            // Fallback: use basic info from token
            updateUserUI({
                full_name: payload.full_name || 'User',
                location: payload.location || 'Unknown',
                role: payload.role || 'field_agent'
            });
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Set default values
        updateUserUI({
            full_name: 'User',
            location: 'Unknown',
            role: 'field_agent'
        });
    }
}

function updateUserUI(userData) {
    const avatar = document.getElementById('userAvatar');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userRole = document.getElementById('userRole');
    
    if (avatar) {
        avatar.textContent = userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'U';
    }
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${userData.full_name || 'User'}`;
    }
    
    if (userRole) {
        const location = userData.location ? userData.location.charAt(0).toUpperCase() + userData.location.slice(1) : 'Unknown';
        userRole.textContent = `Field Agent | ${location} Region`;
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
                loadFundingTrackingData();
                break;
            case 'beneficiaries':
                loadBeneficiaries();
                break;
            case 'assessments':
                loadAssessments();
                break;
            case 'reports':
                loadReports();
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

// Beneficiary Management
function showBeneficiaryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Add New Beneficiary</h2>
            <form id="beneficiaryForm">
                <div class="form-group">
                    <label for="beneficiaryName">Full Name</label>
                    <input type="text" id="beneficiaryName" required>
                </div>
                <div class="form-group">
                    <label for="beneficiaryAge">Age</label>
                    <input type="number" id="beneficiaryAge" min="0" max="120">
                </div>
                <div class="form-group">
                    <label for="beneficiaryGender">Gender</label>
                    <select id="beneficiaryGender">
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="vulnerabilityType">Vulnerability Type</label>
                    <select id="vulnerabilityType" required>
                        <option value="">Select type</option>
                        <option value="poverty">Poverty</option>
                        <option value="refugee">Refugee</option>
                        <option value="disability">Disability</option>
                        <option value="LGBTQI+">LGBTQI+</option>
                        <option value="low_literacy">Low Literacy</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="beneficiaryCounty">County</label>
                    <select id="beneficiaryCounty" required>
                        <option value="">Select county</option>
                        <optgroup label="Coast">
                            <option value="001">Mombasa</option>
                            <option value="002">Kwale</option>
                            <option value="003">Kilifi</option>
                            <option value="004">Tana River</option>
                            <option value="005">Lamu</option>
                            <option value="006">Taita Taveta</option>
                        </optgroup>
                        <optgroup label="North Eastern">
                            <option value="007">Garissa</option>
                            <option value="008">Wajir</option>
                            <option value="009">Mandera</option>
                        </optgroup>
                        <optgroup label="Eastern">
                            <option value="010">Marsabit</option>
                            <option value="011">Isiolo</option>
                            <option value="012">Meru</option>
                            <option value="013">Tharaka Nithi</option>
                            <option value="014">Embu</option>
                            <option value="015">Kitui</option>
                            <option value="016">Machakos</option>
                            <option value="017">Makueni</option>
                        </optgroup>
                        <optgroup label="Central">
                            <option value="018">Nyandarua</option>
                            <option value="019">Nyeri</option>
                            <option value="020">Kirinyaga</option>
                            <option value="021">Murang'a</option>
                            <option value="022">Kiambu</option>
                        </optgroup>
                        <optgroup label="Rift Valley">
                            <option value="023">Turkana</option>
                            <option value="024">West Pokot</option>
                            <option value="025">Samburu</option>
                            <option value="026">Trans Nzoia</option>
                            <option value="027">Uasin Gishu</option>
                            <option value="028">Elgeyo Marakwet</option>
                            <option value="029">Nandi</option>
                            <option value="030">Baringo</option>
                            <option value="031">Laikipia</option>
                            <option value="032">Nakuru</option>
                            <option value="033">Narok</option>
                            <option value="034">Kajiado</option>
                            <option value="035">Kericho</option>
                            <option value="036">Bomet</option>
                        </optgroup>
                        <optgroup label="Western">
                            <option value="037">Kakamega</option>
                            <option value="038">Vihiga</option>
                            <option value="039">Bungoma</option>
                            <option value="040">Busia</option>
                        </optgroup>
                        <optgroup label="Nyanza">
                            <option value="041">Siaya</option>
                            <option value="042">Kisumu</option>
                            <option value="043">Homa Bay</option>
                            <option value="044">Migori</option>
                            <option value="045">Kisii</option>
                            <option value="046">Nyamira</option>
                        </optgroup>
                        <optgroup label="Nairobi">
                            <option value="047">Nairobi</option>
                        </optgroup>
                    </select>
                </div>
                <div class="form-group">
                    <label for="beneficiaryLocation">Specific Location</label>
                    <input type="text" id="beneficiaryLocation" placeholder="e.g., Sub-location, Village">
                </div>
                <div class="form-group">
                    <label for="contactInfo">Contact Information</label>
                    <input type="text" id="contactInfo">
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Add Beneficiary</button>
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
    modal.querySelector('#beneficiaryForm').onsubmit = async (e) => {
        e.preventDefault();
        await addBeneficiary(modal);
    };
}

async function addBeneficiary(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const formData = {
            name: document.getElementById('beneficiaryName').value,
            age: parseInt(document.getElementById('beneficiaryAge').value) || null,
            gender: document.getElementById('beneficiaryGender').value,
            vulnerability_type: document.getElementById('vulnerabilityType').value,
            county: document.getElementById('beneficiaryCounty').value,
            county_code: document.getElementById('beneficiaryCounty').value,
            location: document.getElementById('beneficiaryLocation').value,
            contact_info: document.getElementById('contactInfo').value,
            notes: document.getElementById('notes').value
        };
        
        const response = await fetch('/api/beneficiaries/beneficiaries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('Beneficiary added successfully!', 'success');
            modal.remove();
            loadDashboardData(); // Refresh dashboard stats
            if (document.getElementById('beneficiaries').classList.contains('active')) {
                loadBeneficiaries(); // Refresh beneficiaries list
            }
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add beneficiary');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Assessment Management
function showAssessmentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Create New Assessment</h2>
            <form id="assessmentForm">
                <div class="form-group">
                    <label for="beneficiarySelect">Select Beneficiary</label>
                    <select id="beneficiarySelect" required>
                        <option value="">Loading beneficiaries...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="povertyScore">Poverty Score (1-5)</label>
                    <input type="number" id="povertyScore" min="1" max="5" required>
                </div>
                <div class="form-group">
                    <label for="literacyScore">Literacy Score (1-5)</label>
                    <input type="number" id="literacyScore" min="1" max="5" required>
                </div>
                <div class="form-group">
                    <label for="digitalScore">Digital Access Score (1-5)</label>
                    <input type="number" id="digitalScore" min="1" max="5" required>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="disabilityStatus"> Has Disability
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="lgbtqiStatus"> LGBTQI+ Status
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="refugeeStatus"> Refugee Status
                    </label>
                </div>
                <button type="submit" class="btn btn-primary">Create Assessment</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load beneficiaries for dropdown
    loadBeneficiariesForAssessment(modal);
    
    // Close modal functionality
    modal.querySelector('.close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Form submission
    modal.querySelector('#assessmentForm').onsubmit = async (e) => {
        e.preventDefault();
        await createAssessment(modal);
    };
}

async function loadBeneficiariesForAssessment(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/beneficiaries/beneficiaries', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const select = modal.querySelector('#beneficiarySelect');
            select.innerHTML = '<option value="">Select beneficiary</option>';
            
            data.items.forEach(beneficiary => {
                const option = document.createElement('option');
                option.value = beneficiary.id;
                option.textContent = beneficiary.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading beneficiaries:', error);
    }
}

async function createAssessment(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        const formData = {
            beneficiary_id: parseInt(document.getElementById('beneficiarySelect').value),
            poverty_score: parseInt(document.getElementById('povertyScore').value),
            literacy_score: parseInt(document.getElementById('literacyScore').value),
            digital_access_score: parseInt(document.getElementById('digitalScore').value),
            disability_status: document.getElementById('disabilityStatus').checked,
            lgbtqi_status: document.getElementById('lgbtqiStatus').checked,
            refugee_status: document.getElementById('refugeeStatus').checked
        };
        
        const response = await fetch('/api/beneficiaries/assessments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('Assessment created successfully!', 'success');
            modal.remove();
            loadDashboardData(); // Refresh dashboard stats
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create assessment');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Report Generation
async function generateReport() {
    try {
        const token = localStorage.getItem('heva_token');
        showMessage('Generating report...', 'info');
        
        const response = await fetch('/api/field-agent/report', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const report = await response.json();
            showReportModal(report);
        } else {
            throw new Error('Failed to generate report');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function showReportModal(report) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Field Agent Report</h2>
            <div class="report-content">
                <div class="report-section">
                    <h3>Summary</h3>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    <p>Total Beneficiaries: ${report.total_beneficiaries}</p>
                    <p>Assessments This Month: ${report.assessments_this_month}</p>
                    <p>High Risk Cases: ${report.high_risk_cases}</p>
                </div>
                <div class="report-section">
                    <h3>Recent Activities</h3>
                    <ul>
                        ${report.recent_activities.map(activity => 
                            `<li>${activity.description} - ${new Date(activity.timestamp).toLocaleDateString()}</li>`
                        ).join('')}
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

function downloadReport() {
    // Placeholder for PDF download functionality
    alert('PDF download functionality will be implemented');
}

// Data Loading Functions
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
                    <div class="beneficiaries-list">
                        <h3>Beneficiaries (${data.total})</h3>
                        <div class="beneficiaries-grid">
                            ${data.items.map(beneficiary => `
                                <div class="beneficiary-card">
                                    <h4>${beneficiary.name}</h4>
                                    <p>Type: ${beneficiary.vulnerability_type}</p>
                                    <p>Age: ${beneficiary.age || 'N/A'}</p>
                                    <p>Location: ${beneficiary.location || 'N/A'}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading beneficiaries:', error);
    }
}

async function loadAssessments() {
    try {
        const token = localStorage.getItem('heva_token');
        const response = await fetch('/api/beneficiaries/assessments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const assessments = await response.json();
            const container = document.getElementById('assessments');
            if (container) {
                container.innerHTML = `
                    <div class="assessments-list">
                        <h3>Recent Assessments</h3>
                        <div class="assessments-grid">
                            ${assessments.map(assessment => `
                                <div class="assessment-card">
                                    <h4>Assessment #${assessment.assessment_id}</h4>
                                    <p>Beneficiary: ${assessment.beneficiary_name}</p>
                                    <p>Date: ${new Date(assessment.assessment_date).toLocaleDateString()}</p>
                                    <p>Poverty Score: ${assessment.poverty_score}/5</p>
                                    <p>Literacy Score: ${assessment.literacy_score}/5</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading assessments:', error);
    }
}

async function loadReports() {
    const container = document.getElementById('reports');
    if (container) {
        container.innerHTML = `
            <div class="reports-section">
                <h3>Reports</h3>
                <div class="reports-grid">
                    <div class="report-card">
                        <h4>Monthly Summary</h4>
                        <p>Generate a comprehensive monthly report</p>
                        <button onclick="generateReport()" class="btn btn-primary">Generate</button>
                    </div>
                    <div class="report-card">
                        <h4>Beneficiary Analysis</h4>
                        <p>Detailed analysis of beneficiary data</p>
                        <button onclick="generateBeneficiaryReport()" class="btn btn-primary">Generate</button>
                    </div>
                </div>
            </div>
        `;
    }
}

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
                        <h3>Profile</h3>
                        <div class="profile-card">
                            <div class="profile-avatar">${userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'U'}</div>
                            <div class="profile-details">
                                <h4>${userData.full_name || 'User'}</h4>
                                <p><strong>Username:</strong> ${userData.username}</p>
                                <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
                                <p><strong>Role:</strong> ${userData.role}</p>
                                <p><strong>Location:</strong> ${userData.location}</p>
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

function editProfile() {
    alert('Profile editing functionality will be implemented');
}

function changePassword() {
    alert('Password change functionality will be implemented');
}

function generateBeneficiaryReport() {
    alert('Beneficiary report generation will be implemented');
}

// Real-time updates
function startRealTimeUpdates() {
    // Add real-time indicator
    const indicator = document.createElement('div');
    indicator.className = 'real-time-indicator';
    indicator.innerHTML = '<i class="fas fa-circle"></i> Live Data';
    document.body.appendChild(indicator);
    
    // Update dashboard data every 30 seconds
    setInterval(() => {
        if (document.querySelector('.field-agent-dashboard')) {
            loadDashboardData();
            // Flash indicator to show update
            indicator.style.animation = 'none';
            setTimeout(() => {
                indicator.style.animation = 'pulse 2s infinite';
            }, 100);
        }
    }, 30000);
    
    // Also update when user becomes active
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && document.querySelector('.field-agent-dashboard')) {
            loadDashboardData();
        }
    });
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
        padding: 15px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
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

// Funding Tracking Functions
// Add these functions to your field_agent.js

// Load beneficiaries for funding request dropdown
async function loadBeneficiariesForFunding() {
    try {
        const response = await fetch('/api/field_agent/beneficiaries');
        if (!response.ok) throw new Error('Failed to load beneficiaries');
        
        const data = await response.json();
        const select = document.getElementById('fundingBeneficiary');
        
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add new options
        data.forEach(beneficiary => {
            const option = document.createElement('option');
            option.value = beneficiary.beneficiary_id;
            option.textContent = `${beneficiary.name} (${beneficiary.vulnerability_type})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading beneficiaries:', error);
        showAlert('error', 'Failed to load beneficiaries');
    }
}

// Handle funding request form submission
async function handleFundingRequestSubmit(e) {
    e.preventDefault();
    
    const beneficiaryId = document.getElementById('fundingBeneficiary').value;
    const amount = document.getElementById('fundingAmount').value;
    const notes = document.getElementById('fundingNotes').value;
    
    try {
        const response = await fetch('/api/field_agent/funding/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                beneficiary_id: beneficiaryId,
                amount: amount,
                notes: notes
            })
        });
        
        if (!response.ok) throw new Error('Funding request failed');
        
        const result = await response.json();
        showAlert('success', 'Funding request submitted successfully!');
        closeModal('fundingRequestModal');
        loadFundingTrackingData(); // Refresh the funding table
    } catch (error) {
        console.error('Error submitting funding request:', error);
        showAlert('error', 'Failed to submit funding request');
    }
}

// Load funding tracking data
async function loadFundingTrackingData() {
    try {
        const response = await fetch('/api/field_agent/funding/tracking');
        if (!response.ok) throw new Error('Failed to load funding data');
        
        const data = await response.json();
        const tableBody = document.getElementById('fundingTrackingTable');
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Add new rows
        data.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.vulnerability_type}</td>
                <td><span class="status-badge ${item.funding_status}">${item.funding_status}</span></td>
                <td>KES ${item.funding_amount ? item.funding_amount.toLocaleString() : '0'}</td>
                <td>${item.registration_date || 'N/A'}</td>
                <td>${item.funding_approved_date || 'Pending'}</td>
                <td>${item.funding_notes || ''}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Update stats
        updateFundingStats();
    } catch (error) {
        console.error('Error loading funding data:', error);
        showAlert('error', 'Failed to load funding data');
    }
}

// Update funding stats
async function updateFundingStats() {
    try {
        const response = await fetch('/api/field_agent/funding/stats');
        if (!response.ok) throw new Error('Failed to load funding stats');
        
        const data = await response.json();
        
        document.getElementById('trackedBeneficiaries').textContent = data.tracked_beneficiaries;
        document.getElementById('approvedFunds').textContent = data.approved_funds;
        document.getElementById('pendingFunds').textContent = data.pending_funds;
        document.getElementById('declinedFunds').textContent = data.declined_funds || 0;
    } catch (error) {
        console.error('Error loading funding stats:', error);
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Funding request button
    document.getElementById('requestFundingBtn').addEventListener('click', () => {
        loadBeneficiariesForFunding();
        openModal('fundingRequestModal');
    });
    
    // Funding form submission
    document.getElementById('fundingRequestForm').addEventListener('submit', handleFundingRequestSubmit);
    
    // Cancel button
    document.getElementById('cancelFundingRequest').addEventListener('click', () => {
        closeModal('fundingRequestModal');
    });
    
    // Load funding data when section is shown
    document.querySelector('a[href="#funding"]').addEventListener('click', loadFundingTrackingData);
});

function showRequestFundingModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'fundingRequestModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-money-bill-wave"></i> Request Funding for Beneficiary</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="requestFundingForm">
                    <div class="form-group">
                        <label for="beneficiarySelect">Select Beneficiary:</label>
                        <select id="beneficiarySelect" class="form-control" required>
                            <option value="">Choose a beneficiary...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="fundingAmount">Funding Amount (KES):</label>
                        <input type="number" id="fundingAmount" class="form-control" min="100" step="100" required>
                    </div>
                    <div class="form-group">
                        <label for="fundingNotes">Justification/Notes:</label>
                        <textarea id="fundingNotes" class="form-control" rows="4" placeholder="Enter justification for funding request..." required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Submit Request
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    loadBeneficiariesForFunding(modal);
    setupModalClose(modal);
    
    // Show the modal
    modal.style.display = 'block';
}

async function loadBeneficiariesForFunding(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        showMessage('Loading beneficiaries...', 'info');

        const response = await fetch('/api/field_agent/beneficiaries', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const beneficiaries = await response.json();
            const select = modal.querySelector('#beneficiarySelect');
            
            // Clear existing options
            select.innerHTML = '<option value="">Choose a beneficiary...</option>';
            
            if (beneficiaries.length === 0) {
                showMessage('No beneficiaries found in database. Please add beneficiaries first.', 'warning');
                return;
            }
            
            beneficiaries.forEach(beneficiary => {
                const option = document.createElement('option');
                option.value = beneficiary.beneficiary_id;
                option.textContent = `${beneficiary.name} - ${beneficiary.vulnerability_type} (${beneficiary.county})`;
                select.appendChild(option);
            });
            
            showMessage(`Loaded ${beneficiaries.length} beneficiaries successfully`, 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to load beneficiaries`);
        }

        // Setup form submission
        const form = modal.querySelector('#requestFundingForm');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitFundingRequest(modal);
        });

    } catch (error) {
        console.error('Error loading beneficiaries:', error);
        showMessage(`Failed to load beneficiaries: ${error.message}`, 'error');
        
        // Show more detailed error information
        if (error.message.includes('Database error')) {
            showMessage('Database connection issue. Please check if the database is running and accessible.', 'error');
        } else if (error.message.includes('401')) {
            showMessage('Authentication failed. Please log in again.', 'error');
        } else if (error.message.includes('403')) {
            showMessage('Access denied. You do not have permission to access this resource.', 'error');
        } else if (error.message.includes('500')) {
            showMessage('Server error. Please try again later or contact support.', 'error');
        }
    }
}

async function submitFundingRequest(modal) {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const beneficiaryId = modal.querySelector('#beneficiarySelect').value;
        const amount = modal.querySelector('#fundingAmount').value;
        const notes = modal.querySelector('#fundingNotes').value;

        // Validate inputs
        if (!beneficiaryId) {
            showMessage('Please select a beneficiary', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            showMessage('Please enter a valid funding amount', 'error');
            return;
        }

        showMessage('Submitting funding request...', 'info');

        const response = await fetch('/api/field_agent/funding/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                beneficiary_id: parseInt(beneficiaryId),
                amount: parseFloat(amount),
                notes: notes
            })
        });

        if (response.ok) {
            const result = await response.json();
            showMessage(result.message, 'success');
            closeModal();
            loadFundingTrackingData(); // Refresh the data
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to submit funding request`);
        }

    } catch (error) {
        console.error('Error submitting funding request:', error);
        
        // Show more detailed error information
        if (error.message.includes('Beneficiary with ID')) {
            showMessage('Selected beneficiary not found. Please refresh and try again.', 'error');
        } else if (error.message.includes('Invalid amount format')) {
            showMessage('Please enter a valid numeric amount.', 'error');
        } else if (error.message.includes('Database error')) {
            showMessage('Database connection issue. Please try again later.', 'error');
        } else if (error.message.includes('401')) {
            showMessage('Authentication failed. Please log in again.', 'error');
        } else if (error.message.includes('403')) {
            showMessage('Access denied. You do not have permission to submit funding requests.', 'error');
        } else if (error.message.includes('500')) {
            showMessage('Server error. Please try again later or contact support.', 'error');
        } else {
            showMessage(`Failed to submit funding request: ${error.message}`, 'error');
        }
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
        
        const response = await fetch('/api/field_agent/report', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                report_type: 'funding_tracking',
                date_range: 'last_month'
            })
        });

        if (response.ok) {
            const result = await response.json();
            showMessage('Funding report generated successfully', 'success');
            // You could download the report here if it returns a file
        } else {
            const error = await response.json();
            showMessage(error.error || 'Failed to generate funding report', 'error');
        }

    } catch (error) {
        console.error('Error generating funding report:', error);
        showMessage('Failed to generate funding report', 'error');
    }
}

function closeModal() {
    const modal = document.getElementById('fundingRequestModal') || document.querySelector('.modal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove();
    }
}

function setupModalClose(modal) {
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal();
        });
    }
    
    // Close modal when clicking outside of it
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Chart update functions for real-time data
function updateGenderChart(genderData) {
    const genderChartContainer = document.getElementById('genderChart');
    if (!genderChartContainer) return;
    
    const total = Object.values(genderData).reduce((sum, count) => sum + count, 0);
    if (total === 0) {
        genderChartContainer.innerHTML = '<p class="text-muted">No gender data available</p>';
        return;
    }
    
    const chartHTML = Object.entries(genderData).map(([gender, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div class="chart-item">
                <div class="chart-label">${gender}</div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${count} (${percentage}%)</div>
            </div>
        `;
    }).join('');
    
    genderChartContainer.innerHTML = chartHTML;
}

function updateRegionChart(regionData) {
    const regionChartContainer = document.getElementById('regionChart');
    if (!regionChartContainer) return;
    
    const total = Object.values(regionData).reduce((sum, count) => sum + count, 0);
    if (total === 0) {
        regionChartContainer.innerHTML = '<p class="text-muted">No region data available</p>';
        return;
    }
    
    const chartHTML = Object.entries(regionData).map(([region, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div class="chart-item">
                <div class="chart-label">${region}</div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${count} (${percentage}%)</div>
            </div>
        `;
    }).join('');
    
    regionChartContainer.innerHTML = chartHTML;
}

function updateVulnerabilityChart(vulnerabilityData) {
    const vulnerabilityChartContainer = document.getElementById('vulnerabilityChart');
    if (!vulnerabilityChartContainer) return;
    
    const total = Object.values(vulnerabilityData).reduce((sum, count) => sum + count, 0);
    if (total === 0) {
        vulnerabilityChartContainer.innerHTML = '<p class="text-muted">No vulnerability data available</p>';
        return;
    }
    
    const chartHTML = Object.entries(vulnerabilityData).map(([vulnType, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div class="chart-item">
                <div class="chart-label">${vulnType.replace('_', ' ').toUpperCase()}</div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-value">${count} (${percentage}%)</div>
            </div>
        `;
    }).join('');
    
    vulnerabilityChartContainer.innerHTML = chartHTML;
}

// Funding Report Functions
function showFundingReportModal() {
    const modal = document.getElementById('fundingReportModal');
    if (modal) {
        modal.style.display = 'block';
        loadFundingReport();
    }
}

async function loadFundingReport() {
    try {
        const token = localStorage.getItem('heva_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        showMessage('Loading funding report...', 'info');

        const response = await fetch('/api/field_agent/funding/report', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const report = await response.json();
            updateFundingReportUI(report);
            showMessage('Funding report loaded successfully', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to load funding report`);
        }

    } catch (error) {
        console.error('Error loading funding report:', error);
        showMessage(`Failed to load funding report: ${error.message}`, 'error');
    }
}

function updateFundingReportUI(report) {
    // Update summary stats
    document.getElementById('totalRequests').textContent = report.summary.total_requests;
    document.getElementById('approvedCount').textContent = report.summary.approved_count;
    document.getElementById('pendingCount').textContent = report.summary.pending_count;
    document.getElementById('declinedCount').textContent = report.summary.declined_count;
    document.getElementById('totalApprovedAmount').textContent = `KES ${report.summary.total_approved_amount.toLocaleString()}`;

    // Update approved beneficiaries list
    const approvedList = document.getElementById('approvedBeneficiariesList');
    approvedList.innerHTML = report.approved_beneficiaries.map(beneficiary => `
        <div class="beneficiary-item approved">
            <div class="beneficiary-info">
                <strong>${beneficiary.name}</strong> - ${beneficiary.vulnerability_type}
            </div>
            <div class="beneficiary-details">
                <span>Amount: KES ${beneficiary.funding_amount?.toLocaleString() || '0'}</span>
                <span>County: ${beneficiary.county}</span>
                <span>Approved: ${beneficiary.funding_approved_date ? new Date(beneficiary.funding_approved_date).toLocaleDateString() : 'N/A'}</span>
            </div>
        </div>
    `).join('') || '<p class="text-muted">No approved beneficiaries</p>';

    // Update pending beneficiaries list
    const pendingList = document.getElementById('pendingBeneficiariesList');
    pendingList.innerHTML = report.pending_beneficiaries.map(beneficiary => `
        <div class="beneficiary-item pending">
            <div class="beneficiary-info">
                <strong>${beneficiary.name}</strong> - ${beneficiary.vulnerability_type}
            </div>
            <div class="beneficiary-details">
                <span>Amount: KES ${beneficiary.funding_amount?.toLocaleString() || '0'}</span>
                <span>County: ${beneficiary.county}</span>
                <span>Requested: ${beneficiary.registration_date ? new Date(beneficiary.registration_date).toLocaleDateString() : 'N/A'}</span>
            </div>
        </div>
    `).join('') || '<p class="text-muted">No pending beneficiaries</p>';

    // Update declined beneficiaries list
    const declinedList = document.getElementById('declinedBeneficiariesList');
    declinedList.innerHTML = report.declined_beneficiaries.map(beneficiary => `
        <div class="beneficiary-item declined">
            <div class="beneficiary-info">
                <strong>${beneficiary.name}</strong> - ${beneficiary.vulnerability_type}
            </div>
            <div class="beneficiary-details">
                <span>Amount: KES ${beneficiary.funding_amount?.toLocaleString() || '0'}</span>
                <span>County: ${beneficiary.county}</span>
                <span>Notes: ${beneficiary.funding_notes || 'No notes'}</span>
            </div>
        </div>
    `).join('') || '<p class="text-muted">No declined beneficiaries</p>';
}