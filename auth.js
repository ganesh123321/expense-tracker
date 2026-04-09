// Base URL for your backend API
const API_URL = 'http://localhost:8000/api/v1/auth';

/**
 * Handle user registration
 * @param {string} email 
 * @param {string} password 
 */
async function register(email, password) {
    try {
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + Math.floor(Math.random()*1000);
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, username })
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
        console.warn('Backend server unreachable. Falling back to offline mode (localStorage).');
        
        // --- OFFLINE / GITHUB PAGES FALLBACK ---
        let users = JSON.parse(localStorage.getItem('mockUsers')) || [];
        if (users.find(u => u.email === email)) {
            alert('User already exists');
            return;
        }
        users.push({ email, password });
        localStorage.setItem('mockUsers', JSON.stringify(users));
        
        alert('Registration successful! (Offline Mode)');
        window.location.href = 'login.html';
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
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            // Save the JWT token to localStorage
            localStorage.setItem('token', data.access_token);
            alert('Login successful!');
            
            // Redirect to the main expense tracker app
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.warn('Backend server unreachable. Falling back to offline mode (localStorage).');
        
        // --- OFFLINE / GITHUB PAGES FALLBACK ---
        let users = JSON.parse(localStorage.getItem('mockUsers')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('token', 'offline-fake-jwt-token-' + email);
            alert('Login successful! (Offline Mode)');
            window.location.href = 'index.html';
        } else {
            alert('Invalid credentials (Offline Mode)');
        }
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
