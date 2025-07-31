document.addEventListener('DOMContentLoaded', function() {
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strengthIndicator = this.parentElement.querySelector('.password-strength');
            const strength = calculatePasswordStrength(this.value);
            strengthIndicator.style.width = `${strength.score * 25}%`;
            strengthIndicator.style.backgroundColor = strength.color;
        });
    }

    // Registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const errorElement = document.getElementById('errorMessage');
            
            // Validate passwords match
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                errorElement.textContent = 'Passwords do not match';
                errorElement.classList.remove('hidden');
                return;
            }
            
            // Submit form
            try {
                const formData = {
                    username: document.getElementById('username').value,
                    password: password,
                    fullName: document.getElementById('fullName').value,
                    email: document.getElementById('email').value,
                    role: 'field_agent'
                };
                
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
                
                // Redirect to login on success
                window.location.href = '/login?registered=true';
            } catch (error) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('hidden');
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const errorElement = document.getElementById('errorMessage');
            
            try {
                const formData = {
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value
                };
                
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }
                
                // Store token and redirect based on role
                localStorage.setItem('heva_token', data.token);
                
                // Redirect based on user role
                switch(data.role) {
                    case 'admin':
                        window.location.href = '/admin-dashboard';
                        break;
                    case 'manager':
                        window.location.href = '/manager-dashboard';
                        break;
                    case 'analyst':
                        window.location.href = '/analyst-dashboard';
                        break;
                    case 'field_agent':
                    default:
                        window.location.href = '/dashboard';
                        break;
                }
            } catch (error) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('hidden');
            }
        });
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