(() => {
  'use strict';

  // Join page specific functions
  async function handleRegistration(formData) {
    const { nome, cognome, email, username, password, confirmPassword, role, gender } = formData;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Reset messages
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');
    
    // Validate role selection
    if (!role) {
      showRegistrationError('Please select an account type!');
      return;
    }
    
    // Validate gender selection
    if (!gender) {
      showRegistrationError('Please select your gender!');
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showRegistrationError('Passwords do not match!');
      return;
    }
    
    try {
      const api = new Utils.ApiManager();
      const response = await api.post('/api/auth/register', { 
        username, 
        password, 
        nome, 
        cognome, 
        email, 
        role,
        gender
      });
      
      // Registration successful
      showRegistrationSuccess('Account created successfully! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'client') {
          window.location.href = '/membership';
        } else if (role === 'trainer') {
          window.location.href = '/trainer/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);
      showRegistrationError(error.message || 'Registration failed. Please try again.');
    }
  }

  function showRegistrationError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv && successDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('d-none');
      successDiv.classList.add('d-none');
    }
  }

  function showRegistrationSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv && successDiv) {
      successDiv.textContent = message;
      successDiv.classList.remove('d-none');
      errorDiv.classList.add('d-none');
    }
  }

  // Login page specific functions
  async function handleLogin(formData) {
    const { username, password } = formData;
    const errorDiv = document.getElementById('errorMessage');
    
    try {
      const api = new Utils.ApiManager();
      const response = await api.post('/api/auth/login', { username, password });
      
      // Login successful - redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      showLoginError(error.message || 'Login failed. Please try again.');
    }
  }

  function showLoginError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('d-none');
    }
  }

  // Initialize join page functionality
  function initJoinPage() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          nome: document.getElementById('nome').value,
          cognome: document.getElementById('cognome').value,
          email: document.getElementById('email').value,
          username: document.getElementById('username').value,
          password: document.getElementById('password').value,
          confirmPassword: document.getElementById('confirmPassword').value,
          role: document.getElementById('role').value,
          gender: document.getElementById('gender').value
        };
        
        await handleRegistration(formData);
      });
    }
  }

  // Initialize login page functionality
  function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          username: document.getElementById('username').value,
          password: document.getElementById('password').value
        };
        
        await handleLogin(formData);
      });
    }
  }

  // Export authentication functions
  window.Auth = {
    handleRegistration,
    showRegistrationError,
    showRegistrationSuccess,
    handleLogin,
    showLoginError,
    initJoinPage,
    initLoginPage
  };
})();
