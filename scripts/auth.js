// DOM Elements
let isLoginMode = false;
let formElements = {};
let supabaseReady = false;
let authCheckRetries = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log('auth.js loaded and DOM is ready');
    
    // Initialize form elements
    initFormElements();
    
    // Add event listeners
    addEventListeners();

    // Listen for Supabase initialization
    document.addEventListener('supabase-ready', function() {
        console.log('Supabase is ready in auth.js');
        supabaseReady = true;
        setTimeout(checkAuthState, 500); // Wait for auth functions to be fully defined
    });
    
    // For demonstration purposes, check auth without requiring login (DEMO)
    if (window.location.href.includes('?demo=true')) {
        console.log('Demo mode activated - skipping auth checks');
        demoRedirect();
        return;
    }
    
    // Check if we're on the auth page and try auth check after a delay
    if (window.location.pathname.includes('auth.html') || 
        window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname === '') {
        setTimeout(tryAuthCheck, 1500);
    }
});

// Try to check auth state, with retries
function tryAuthCheck() {
    authCheckRetries++;
    
    if (typeof window.getCurrentUser === 'function') {
        checkAuthState();
    } else if (authCheckRetries < 5) {
        console.log(`Auth check retry ${authCheckRetries}/5 - getCurrentUser not available yet`);
        setTimeout(tryAuthCheck, 1000);
    } else {
        console.error('Could not initialize authentication after multiple attempts');
        if (window.location.pathname.includes('user.html') || 
            window.location.pathname.includes('driver.html')) {
            // For demo purposes, allow access anyway
            console.log('Allowing access to dashboard for demonstration');
        }
    }
}

// Demo mode - skip auth for demonstration
function demoRedirect() {
    const path = window.location.pathname;
    if (path.includes('auth.html') || path.includes('index.html') || path === '/' || path === '') {
        // In demo mode, redirect to user dashboard
        setTimeout(() => {
            window.location.href = 'user.html?demo=true';
        }, 1500);
    }
}

function initFormElements() {
    // Get form elements if on auth page
    if (window.location.pathname.includes('auth.html')) {
        formElements = {
            form: document.getElementById('signup-form'),
            firstName: document.getElementById('first-name'),
            lastName: document.getElementById('last-name'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            countryCode: document.getElementById('country-code'),
            password: document.getElementById('password'),
            clearEmail: document.getElementById('clear-email'),
            togglePassword: document.getElementById('toggle-password'),
            toggleAuth: document.getElementById('toggle-auth'),
            roleUser: document.getElementById('role-user'),
            roleDriver: document.getElementById('role-driver'),
            authButton: document.querySelector('.auth-button'),
            authHeader: document.querySelector('.auth-header h2')
        };
        
        // Fix role selection by adding event handlers to the labels
        const roleUserLabel = document.querySelector('label[for="role-user"]');
        const roleDriverLabel = document.querySelector('label[for="role-driver"]');
        
        if (roleUserLabel) {
            roleUserLabel.addEventListener('click', function() {
                if (formElements.roleUser) {
                    formElements.roleUser.checked = true;
                    formElements.roleDriver.checked = false;
                    
                    // Add visual feedback
                    this.closest('.role-option').classList.add('selected');
                    roleDriverLabel.closest('.role-option').classList.remove('selected');
                }
            });
        }
        
        if (roleDriverLabel) {
            roleDriverLabel.addEventListener('click', function() {
                if (formElements.roleDriver) {
                    formElements.roleDriver.checked = true;
                    formElements.roleUser.checked = false;
                    
                    // Add visual feedback
                    this.closest('.role-option').classList.add('selected');
                    roleUserLabel.closest('.role-option').classList.remove('selected');
                }
            });
        }
        
        // Add visual feedback for currently selected role
        if (formElements.roleUser && formElements.roleUser.checked) {
            roleUserLabel.closest('.role-option').classList.add('selected');
        } else if (formElements.roleDriver && formElements.roleDriver.checked) {
            roleDriverLabel.closest('.role-option').classList.add('selected');
        }
    } else {
    // Initialize next button on landing page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'auth.html';
            });
        }
        
        // Set up pagination dots functionality
        const dots = document.querySelectorAll('.pagination .dot');
        if (dots.length > 0) {
            let currentDot = 0;
            
            // Function to update active dot
            function updateActiveDot() {
                dots.forEach((dot, index) => {
                    if (index === currentDot) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }
            
            // Click through dots
            dots.forEach((dot, index) => {
                dot.addEventListener('click', function() {
                    currentDot = index;
                    updateActiveDot();
                    // Here you would also change onboarding slide content
                });
            });
            }
        }
    }
}

// Add event listeners to form elements
function addEventListeners() {
    // Only add these listeners if we're on the auth page and form exists
    if (!formElements.form) return;
    
    // Form submission
    formElements.form.addEventListener('submit', handleFormSubmit);
    
    // Toggle between login/signup
    if (formElements.toggleAuth) {
    formElements.toggleAuth.addEventListener('click', toggleAuthMode);
    }
    
    // Clear email button
    if (formElements.clearEmail) {
    formElements.clearEmail.addEventListener('click', function() {
        formElements.email.value = '';
        formElements.email.focus();
    });
    }
    
    // Toggle password visibility
    if (formElements.togglePassword) {
    formElements.togglePassword.addEventListener('click', function() {
        const type = formElements.password.getAttribute('type') === 'password' ? 'text' : 'password';
        formElements.password.setAttribute('type', type);
        
        // Change icon (using emoji for simplicity, can use font awesome icons)
        this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
    }
}

function toggleAuthMode(e) {
    if (e && e.preventDefault) e.preventDefault();
    isLoginMode = !isLoginMode;
    
    // Check if all elements exist before updating UI
    if (!formElements.authHeader || !formElements.authButton) {
        console.error('Form elements not found for toggle auth mode');
        return;
    }
    
    // Update UI
    if (isLoginMode) {
        // Switch to login mode
        formElements.authHeader.textContent = 'Log in';
        formElements.authButton.textContent = 'Log in';
        
        // Find toggle link and update
        const toggleLink = document.querySelector('.auth-header p a');
        if (toggleLink) toggleLink.textContent = 'Sign up';
        
        // Hide signup-only fields
        const formRow = document.querySelector('.form-row');
        if (formRow) formRow.style.display = 'none';
        
        const roleSelection = document.querySelector('.role-selection');
        if (roleSelection) roleSelection.style.display = 'none';
        
        // Update explanatory text
        const headerText = document.querySelector('.auth-header p');
        if (headerText) headerText.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-auth">Sign up</a>';
    } else {
        // Switch to signup mode
        formElements.authHeader.textContent = 'Sign up';
        formElements.authButton.textContent = 'Sign up';
        
        // Find toggle link and update
        const toggleLink = document.querySelector('.auth-header p a');
        if (toggleLink) toggleLink.textContent = 'Log in';
        
        // Show signup fields
        const formRow = document.querySelector('.form-row');
        if (formRow) formRow.style.display = 'flex';
        
        const roleSelection = document.querySelector('.role-selection');
        if (roleSelection) roleSelection.style.display = 'flex';
        
        // Update explanatory text
        const headerText = document.querySelector('.auth-header p');
        if (headerText) headerText.innerHTML = 'Already have an account? <a href="#" id="toggle-auth">Log in</a>';
    }
    
    // Re-add event listener to the new toggle auth element
    const toggleAuth = document.getElementById('toggle-auth');
    if (toggleAuth) {
        toggleAuth.addEventListener('click', toggleAuthMode);
    }
}

async function handleFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    // Wait for Supabase to be ready
    if (!window.signIn || !window.signUp) {
        showError('Authentication system is initializing. Please wait a moment and try again.');
        return;
    }
    
    try {
        if (isLoginMode) {
            // Handle login
            await handleLogin();
        } else {
            // Handle signup
            await handleSignup();
        }
    } catch (error) {
        showError(error.message || 'Authentication error occurred');
    }
}

async function handleLogin() {
    // Check if form elements exist
    if (!formElements.email || !formElements.password) {
        throw new Error('Form elements not found');
    }
    
    const email = formElements.email.value.trim();
    const password = formElements.password.value;
    
    if (!email || !password) {
        throw new Error('Please enter both email and password');
    }
    
    try {
        // Show loading state
        formElements.authButton.textContent = 'Logging in...';
        formElements.authButton.disabled = true;
        
        // For demo purposes, allow any login
        if (email === 'demo@example.com' || window.location.href.includes('?demo=true')) {
            console.log('Using demo login');
            setTimeout(() => {
                window.location.href = 'user.html?demo=true';
            }, 1000);
            return;
        }
        
        // Call Supabase login function
        const data = await window.signIn(email, password);
        console.log('Login successful:', data);
        
        // Check user role and redirect accordingly
        const user = data.user;
        if (user && user.user_metadata && user.user_metadata.role === 'driver') {
            window.location.href = 'driver.html';
        } else {
            window.location.href = 'user.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    } finally {
        // Reset button state
        formElements.authButton.textContent = 'Log in';
        formElements.authButton.disabled = false;
    }
}

async function handleSignup() {
    // Check if form elements exist
    if (!formElements.firstName || !formElements.lastName || !formElements.email || 
        !formElements.phone || !formElements.password) {
        throw new Error('Form elements not found');
    }
    
    // Validate form
    const firstName = formElements.firstName.value.trim();
    const lastName = formElements.lastName.value.trim();
    const email = formElements.email.value.trim();
    const countryCode = formElements.countryCode.value;
    const phone = formElements.phone.value.trim();
    const password = formElements.password.value;
    const role = formElements.roleDriver.checked ? 'driver' : 'user';
    
    if (!firstName || !lastName || !email || !phone || !password) {
        throw new Error('Please fill in all fields');
    }
    
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    
    const fullPhone = `${countryCode}${phone}`;
    
    try {
        // Show loading state
        formElements.authButton.textContent = 'Signing up...';
        formElements.authButton.disabled = true;
        
        // For demo purposes
        if (email === 'demo@example.com' || window.location.href.includes('?demo=true')) {
            console.log('Using demo signup');
            showSuccess('Account created successfully! Please check your email for verification.');
            
            // Automatically switch to login mode after successful signup
            setTimeout(() => {
                isLoginMode = true;
                toggleAuthMode({ preventDefault: () => {} });
            }, 2000);
            return;
        }
        
        // Call Supabase signup function
        const data = await window.signUp(email, password, firstName, lastName, fullPhone, role);
        console.log('Signup successful:', data);
        
        // Show success message
        showSuccess('Account created successfully! Please check your email for verification.');
        
        // Automatically switch to login mode after successful signup
        setTimeout(() => {
            isLoginMode = true;
            toggleAuthMode({ preventDefault: () => {} });
        }, 2000);
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    } finally {
        // Reset button state
        formElements.authButton.textContent = 'Sign up';
        formElements.authButton.disabled = false;
    }
}

function showError(message) {
    console.error('Auth error:', message);
    
    // Create error element if it doesn't exist
    let errorEl = document.querySelector('.auth-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'auth-error';
        errorEl.style.color = 'var(--error)';
        errorEl.style.marginTop = '10px';
        errorEl.style.fontSize = '14px';
        errorEl.style.textAlign = 'center';
        
        // Add to form if it exists, otherwise body
        const form = document.getElementById('signup-form');
        if (form) {
            form.appendChild(errorEl);
        } else {
            // If we're not on the auth page
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(errorEl);
            } else {
            document.body.appendChild(errorEl);
            }
        }
    }
    
    errorEl.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorEl && errorEl.parentNode) {
            errorEl.textContent = '';
        }
    }, 5000);
}

function showSuccess(message) {
    console.log('Auth success:', message);
    
    // Create success element if it doesn't exist
    let successEl = document.querySelector('.auth-success');
    if (!successEl) {
        successEl = document.createElement('div');
        successEl.className = 'auth-success';
        successEl.style.color = 'var(--success)';
        successEl.style.marginTop = '10px';
        successEl.style.fontSize = '14px';
        successEl.style.textAlign = 'center';
        
        // Add to form if it exists, otherwise body
        const form = document.getElementById('signup-form');
        if (form) {
            form.appendChild(successEl);
        } else {
            // If we're not on the auth page
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(successEl);
            } else {
            document.body.appendChild(successEl);
            }
        }
    }
    
    successEl.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (successEl && successEl.parentNode) {
            successEl.textContent = '';
        }
    }, 5000);
}

async function checkAuthState() {
    // Skip auth check in demo mode
    if (window.location.href.includes('?demo=true')) {
        console.log('Demo mode - skipping auth check');
        return;
    }
    
    // Only proceed if we can check authentication
    if (typeof window.getCurrentUser !== 'function') {
        console.log('getCurrentUser function not available yet, will try again later');
        // Try again shortly
        setTimeout(checkAuthState, 1000);
        return;
    }
    
    try {
        const user = await window.getCurrentUser();
        
        if (user) {
            console.log('User is already logged in:', user);
            
            // Redirect if on auth or index page
            const path = window.location.pathname;
            if (path.includes('auth.html') || path.includes('index.html') || path === '/' || path === '') {
                // Get user role safely
                const role = user.user_metadata && user.user_metadata.role;
                if (role === 'driver') {
                    window.location.href = 'driver.html';
                } else {
                    window.location.href = 'user.html';
                }
            }
        } else {
            console.log('No user logged in');
            
            // If on user or driver page, redirect to auth
            const path = window.location.pathname;
            if (path.includes('user.html') || path.includes('driver.html') || path.includes('ride-confirm.html')) {
                // For demo purposes, allow access to pages
                if (window.location.href.includes('?demo=true')) {
                    console.log('Demo mode - allowing access without authentication');
                    return;
                }
                window.location.href = 'auth.html';
            }
        }
    } catch (error) {
        console.error('Error checking auth state:', error);
        
        // For demo purposes, allow access to pages
        if (window.location.pathname.includes('user.html') || 
            window.location.pathname.includes('driver.html')) {
            console.log('Error during auth check, but allowing access for demonstration');
        }
    }
} 