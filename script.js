// SecurePass - Enterprise Password Manager
// Professional JavaScript implementation with proper user management

class SecurePass {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.passwords = [];
        this.users = this.loadUsers(); // Simulated backend
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindEvents();
        // Don't load passwords here - only load after user is authenticated
    }

    // User Management (Simulated Backend)
    loadUsers() {
        const stored = localStorage.getItem('securepass_users');
        return stored ? JSON.parse(stored) : [];
    }

    saveUsers() {
        localStorage.setItem('securepass_users', JSON.stringify(this.users));
    }

    createUser(name, email, password) {
        // Check if user already exists
        const existingUser = this.users.find(user => user.email === email);
        if (existingUser) {
            return { success: false, message: 'User with this email already exists' };
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            password: this.hashPassword(password), // In production, use proper hashing
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        return { success: true, message: 'Account created successfully!' };
    }

    authenticateUser(email, password) {
        const user = this.users.find(u => u.email === email);
        if (!user) {
            return { success: false, message: 'Account not found. Please create an account first.' };
        }

        if (this.verifyPassword(password, user.password)) {
            return { success: true, user: { id: user.id, name: user.name, email: user.email } };
        } else {
            return { success: false, message: 'Invalid password' };
        }
    }

    // Simple password hashing (for demo - use proper hashing in production)
    hashPassword(password) {
        return btoa(password + 'salt'); // Base64 with salt
    }

    verifyPassword(password, hashedPassword) {
        return btoa(password + 'salt') === hashedPassword;
    }

    // Authentication Methods
    checkAuthStatus() {
        const user = localStorage.getItem('securepass_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.isAuthenticated = true;
            this.showMainApp();
        } else {
            this.showSignIn();
        }
    }



    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.passwords = []; // Clear passwords from memory
        localStorage.removeItem('securepass_user');
        this.showSignIn();
        this.showMessage('Successfully signed out!', 'success');
    }

    // UI Methods
    showSignIn() {
        document.getElementById('signin-page').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        this.showSignInForm();
    }

    showSignInForm() {
        document.getElementById('signin-form').parentElement.style.display = 'block';
        document.getElementById('create-account-card').style.display = 'none';
    }

    showCreateAccountForm() {
        document.getElementById('signin-form').parentElement.style.display = 'none';
        document.getElementById('create-account-card').style.display = 'block';
    }

    showMainApp() {
        document.getElementById('signin-page').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        document.getElementById('user-email').textContent = this.currentUser.email;
        this.loadPasswords(); // Load passwords only after user is authenticated
        this.updateDashboard();
        this.updateAccountInfo();
        this.showSection('dashboard');
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        document.getElementById(sectionId).classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    }

    // Password Management
    loadPasswords() {
        if (!this.currentUser || !this.currentUser.id) {
            this.passwords = [];
            return;
        }
        
        const stored = localStorage.getItem(`securepass_passwords_${this.currentUser.id}`);
        this.passwords = stored ? JSON.parse(stored) : [];
        this.updatePasswordsTable();
        this.updateDashboard();
    }

    savePassword(website, username, password) {
        if (!this.currentUser || !this.currentUser.id) {
            this.showMessage('User not authenticated!', 'error');
            return;
        }
        
        const newPassword = {
            id: Date.now(),
            website,
            username,
            password: this.encryptPassword(password),
            createdAt: new Date().toISOString()
        };
        
        this.passwords.push(newPassword);
        localStorage.setItem(`securepass_passwords_${this.currentUser.id}`, JSON.stringify(this.passwords));
        this.updatePasswordsTable();
        this.updateDashboard();
        this.showMessage('Password saved successfully!', 'success');
    }

    deletePassword(id) {
        if (!this.currentUser || !this.currentUser.id) {
            this.showMessage('User not authenticated!', 'error');
            return;
        }
        
        this.passwords = this.passwords.filter(pwd => pwd.id !== id);
        localStorage.setItem(`securepass_passwords_${this.currentUser.id}`, JSON.stringify(this.passwords));
        this.updatePasswordsTable();
        this.updateDashboard();
        this.showMessage('Password deleted successfully!', 'success');
    }

    updatePasswordsTable() {
        const tbody = document.getElementById('passwords-tbody');
        if (!tbody) return;
        
        const searchTerm = document.getElementById('search-passwords')?.value.toLowerCase() || '';
        
        const filteredPasswords = this.passwords.filter(pwd => 
            pwd.website.toLowerCase().includes(searchTerm) ||
            pwd.username.toLowerCase().includes(searchTerm)
        );

        if (filteredPasswords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-key" style="font-size: 48px; color: #ddd; margin-bottom: 15px; display: block;"></i>
                        <p>No passwords found</p>
                        <p style="font-size: 14px; margin-top: 10px;">Add your first password to get started</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredPasswords.map(pwd => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-globe" style="color: #667eea;"></i>
                        <span>${pwd.website}</span>
                    </div>
                </td>
                <td>${pwd.username}</td>
                <td>
                    <div class="password-field">
                        <span class="password-text" data-password="${pwd.password}">••••••••</span>
                        <button class="password-toggle" onclick="securePass.togglePassword(this)">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn-small delete-btn" onclick="securePass.deletePassword(${pwd.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    togglePassword(button) {
        const passwordText = button.previousElementSibling;
        const password = passwordText.dataset.password;
        const isVisible = passwordText.textContent !== '••••••••';
        
        if (isVisible) {
            passwordText.textContent = '••••••••';
            button.innerHTML = '<i class="fas fa-eye"></i>';
        } else {
            passwordText.textContent = this.decryptPassword(password);
            button.innerHTML = '<i class="fas fa-eye-slash"></i>';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                passwordText.textContent = '••••••••';
                button.innerHTML = '<i class="fas fa-eye"></i>';
            }, 5000);
        }
    }

    updateDashboard() {
        const totalPasswordsElement = document.getElementById('total-passwords');
        
        if (totalPasswordsElement) {
            totalPasswordsElement.textContent = this.passwords.length;
        }
    }

    // Modal Management
    showAddPasswordModal() {
        document.getElementById('add-password-modal').style.display = 'block';
        document.getElementById('new-website').focus();
    }

    closeAddPasswordModal() {
        document.getElementById('add-password-modal').style.display = 'none';
        document.getElementById('add-password-form').reset();
    }

    // Password Generation
    generateRandomPassword() {
        const length = 16;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        document.getElementById('new-password').value = password;
        document.getElementById('new-password').type = 'text';
        
        setTimeout(() => {
            document.getElementById('new-password').type = 'password';
        }, 2000);
    }

    // Encryption (Simple implementation - in production, use proper encryption)
    encryptPassword(password) {
        return btoa(password); // Base64 encoding (for demo purposes)
    }

    decryptPassword(encrypted) {
        return atob(encrypted); // Base64 decoding
    }

    // Navigation Methods
    goToDashboard() {
        this.showSection('dashboard');
    }

    // Account Management
    updateAccountInfo() {
        const accountName = document.getElementById('account-name');
        const accountEmail = document.getElementById('account-email');
        const accountCreated = document.getElementById('account-created');
        
        if (accountName && this.currentUser) {
            accountName.textContent = this.currentUser.name;
        }
        if (accountEmail && this.currentUser) {
            accountEmail.textContent = this.currentUser.email;
        }
        if (accountCreated && this.currentUser) {
            const user = this.users.find(u => u.id === this.currentUser.id);
            if (user) {
                const date = new Date(user.createdAt);
                accountCreated.textContent = date.toLocaleDateString();
            }
        }
    }

    // Password Change Modal
    showChangePasswordModal() {
        document.getElementById('change-password-modal').style.display = 'block';
        document.getElementById('current-password').focus();
    }

    closeChangePasswordModal() {
        document.getElementById('change-password-modal').style.display = 'none';
        document.getElementById('change-password-form').reset();
        this.clearPasswordRequirements();
    }

    // Password Requirements Validation
    validatePassword(password, isCreateAccount = false) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        if (isCreateAccount) {
            // Update visual indicators for create account form
            document.getElementById('create-req-length').classList.toggle('valid', requirements.length);
            document.getElementById('create-req-uppercase').classList.toggle('valid', requirements.uppercase);
            document.getElementById('create-req-lowercase').classList.toggle('valid', requirements.lowercase);
            document.getElementById('create-req-number').classList.toggle('valid', requirements.number);
            document.getElementById('create-req-special').classList.toggle('valid', requirements.special);
        } else {
            // Update visual indicators for change password form
            document.getElementById('req-length').classList.toggle('valid', requirements.length);
            document.getElementById('req-uppercase').classList.toggle('valid', requirements.uppercase);
            document.getElementById('req-lowercase').classList.toggle('valid', requirements.lowercase);
            document.getElementById('req-number').classList.toggle('valid', requirements.number);
            document.getElementById('req-special').classList.toggle('valid', requirements.special);
        }

        return Object.values(requirements).every(req => req);
    }

    clearPasswordRequirements() {
        const requirements = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'];
        const createRequirements = ['create-req-length', 'create-req-uppercase', 'create-req-lowercase', 'create-req-number', 'create-req-special'];
        
        requirements.forEach(req => {
            const element = document.getElementById(req);
            if (element) {
                element.classList.remove('valid');
            }
        });
        
        createRequirements.forEach(req => {
            const element = document.getElementById(req);
            if (element) {
                element.classList.remove('valid');
            }
        });
    }

    // Toggle Sign In Password
    toggleSignInPassword() {
        const passwordInput = document.getElementById('master-password');
        const toggleBtn = document.querySelector('.password-toggle-btn i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleBtn.className = 'fas fa-eye';
        }
    }

    // Change Password
    changePassword(currentPassword, newPassword) {
        if (!this.currentUser || !this.currentUser.id) {
            return { success: false, message: 'User not authenticated' };
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // Verify current password
        if (!this.verifyPassword(currentPassword, user.password)) {
            return { success: false, message: 'Current password is incorrect' };
        }

        // Validate new password
        if (!this.validatePassword(newPassword)) {
            return { success: false, message: 'New password does not meet requirements' };
        }

        // Update password
        user.password = this.hashPassword(newPassword);
        this.saveUsers();
        
        return { success: true, message: 'Password changed successfully!' };
    }

    // Utility Methods
    showMessage(message, type = 'success', location = 'main') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        let targetContainer;
        if (location === 'signin') {
            targetContainer = document.querySelector('.signin-card');
        } else {
            targetContainer = document.querySelector('.container');
        }
        
        if (targetContainer) {
            targetContainer.insertBefore(messageDiv, targetContainer.firstChild);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }
    }

    // Event Binding
    bindEvents() {
        // Sign in form
        document.getElementById('signin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('master-password').value;
            
            const result = this.authenticateUser(email, password);
            if (result.success) {
                this.currentUser = result.user;
                localStorage.setItem('securepass_user', JSON.stringify(this.currentUser));
                this.isAuthenticated = true;
                this.showMainApp();
                this.showMessage('Successfully signed in!', 'success');
            } else {
                this.showMessage(result.message, 'error', 'signin');
            }
        });

        // Create account form
        document.getElementById('create-account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('create-name').value;
            const email = document.getElementById('create-email').value;
            const password = document.getElementById('create-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                this.showMessage('Passwords do not match!', 'error');
                return;
            }
            
            // Validate password requirements
            if (!this.validatePassword(password, true)) {
                this.showMessage('Password does not meet requirements!', 'error');
                return;
            }
            
            const result = this.createUser(name, email, password);
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.showSignInForm();
                document.getElementById('create-account-form').reset();
            } else {
                this.showMessage(result.message, 'error');
            }
        });

        // Toggle between sign in and create account
        document.getElementById('show-create-account').addEventListener('click', (e) => {
            e.preventDefault();
            this.showCreateAccountForm();
        });

        document.getElementById('show-signin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignInForm();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Add password form
        document.getElementById('add-password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const website = document.getElementById('new-website').value;
            const username = document.getElementById('new-username').value;
            const password = document.getElementById('new-password').value;
            
            if (website && username && password) {
                this.savePassword(website, username, password);
                this.closeAddPasswordModal();
            }
        });

        // Search functionality
        document.getElementById('search-passwords')?.addEventListener('input', () => {
            this.updatePasswordsTable();
        });

        // Modal close on outside click
        document.getElementById('add-password-modal').addEventListener('click', (e) => {
            if (e.target.id === 'add-password-modal') {
                this.closeAddPasswordModal();
            }
        });

        document.getElementById('change-password-modal').addEventListener('click', (e) => {
            if (e.target.id === 'change-password-modal') {
                this.closeChangePasswordModal();
            }
        });

        // Change password form
        document.getElementById('change-password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-master-password').value;
            const confirmPassword = document.getElementById('confirm-new-password').value;
            
            if (newPassword !== confirmPassword) {
                this.showMessage('New passwords do not match!', 'error');
                return;
            }
            
            const result = this.changePassword(currentPassword, newPassword);
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.closeChangePasswordModal();
            } else {
                this.showMessage(result.message, 'error');
            }
        });

        // Password requirements validation
        document.getElementById('new-master-password')?.addEventListener('input', (e) => {
            this.validatePassword(e.target.value);
        });

        document.getElementById('create-password')?.addEventListener('input', (e) => {
            this.validatePassword(e.target.value, true);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showAddPasswordModal();
            }
            if (e.key === 'Escape') {
                this.closeAddPasswordModal();
            }
        });
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    securePass.showSection(sectionId);
}

function showAddPasswordModal() {
    securePass.showAddPasswordModal();
}

function closeAddPasswordModal() {
    securePass.closeAddPasswordModal();
}

function generateRandomPassword() {
    securePass.generateRandomPassword();
}

function generatePassword() {
    securePass.showAddPasswordModal();
    setTimeout(() => {
        securePass.generateRandomPassword();
    }, 100);
}

// Initialize the application
const securePass = new SecurePass();