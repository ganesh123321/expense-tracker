// Base URL for your backend API
const API_URL = 'http://localhost:5000/api/auth';

/**
 * Handle user registration
 * @param {string} email 
 * @param {string} password 
 */
async function register(email, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'Registration successful! You can now login.');
            // Optionally redirect to login page
            window.location.href = 'login.html'; 
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        
        let msg = 'An error occurred. Please try again.';
        if (window.location.hostname.includes('github.io') && API_URL.includes('localhost')) {
            msg = 'Cannot connect to local backend from GitHub Pages!\n\nTo test this app with the backend, you MUST open the file locally on your computer (double-click register.html in your folder) instead of using the github.io link. Browsers block HTTP localhost connections from HTTPS websites!';
        }
        
        alert(msg);
    }
}

/**
 * Handle user login
 * @param {string} email 
 * @param {string} password 
 */
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Save the JWT token to localStorage
            localStorage.setItem('token', data.token);
            alert('Login successful!');
            
            // Redirect to the main expense tracker app
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        
        let msg = 'An error occurred. Please try again.';
        if (window.location.hostname.includes('github.io') && API_URL.includes('localhost')) {
            msg = 'Cannot connect to local backend from GitHub Pages!\n\nTo test this app with the backend, you MUST open the file locally on your computer (double-click login.html in your folder) instead of using the github.io link. Browsers block HTTP localhost connections from HTTPS websites!';
        }
        
        alert(msg);
    }
}

/**
 * Logout function to clear token and protect index.html
 */
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

/**
 * Check if user is authenticated (can be called on index.html load)
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // If there's no token, redirect back to login
        window.location.href = 'login.html';
    }
}
