(() => {
  'use strict';

  // Profile page specific functions
  async function handleProfileUpdate(formData) {
    const { nome, cognome, email, currentPassword } = formData;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Reset messages
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');
    
    try {
      const api = new Utils.ApiManager();
      const response = await api.put('/api/users/profile', { 
        nome, 
        cognome, 
        email, 
        currentPassword
      });
      
      // Profile update successful
      showProfileSuccess('Profile updated successfully!');
      
      // Update form fields with new data
      document.getElementById('nome').value = response.nome;
      document.getElementById('cognome').value = response.cognome;
      document.getElementById('email').value = response.email;
      
      // Clear password field
      document.getElementById('currentPassword').value = '';
      
    } catch (error) {
      console.error('Profile update error:', error);
      showProfileError(error.message || 'Profile update failed. Please try again.');
    }
  }

  function showProfileError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv && successDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('d-none');
      successDiv.classList.add('d-none');
    }
  }

  function showProfileSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv && successDiv) {
      successDiv.textContent = message;
      successDiv.classList.remove('d-none');
      errorDiv.classList.add('d-none');
    }
  }

  // Password update functions
  async function handlePasswordUpdate(formData) {
    const { currentPasswordForChange, newPassword, confirmNewPassword } = formData;
    
    const errorDiv = document.getElementById('passwordErrorMessage');
    const successDiv = document.getElementById('passwordSuccessMessage');
    
    // Reset messages
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');
    
    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      showPasswordError('New passwords do not match!');
      return;
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      showPasswordError('New password must be at least 6 characters long!');
      return;
    }
    
    try {
      const api = new Utils.ApiManager();
      const response = await api.put('/api/users/password', { 
        currentPassword: currentPasswordForChange,
        newPassword,
        confirmPassword: confirmNewPassword
      });
      
      // Password update successful
      showPasswordSuccess('Password updated successfully!');
      
      // Clear form fields
      document.getElementById('currentPasswordForChange').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmNewPassword').value = '';
      
    } catch (error) {
      console.error('Password update error:', error);
      showPasswordError(error.message || 'Password update failed. Please try again.');
    }
  }

  function showPasswordError(message) {
    const errorDiv = document.getElementById('passwordErrorMessage');
    const successDiv = document.getElementById('passwordSuccessMessage');
    
    if (errorDiv && successDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('d-none');
      successDiv.classList.add('d-none');
    }
  }

  function showPasswordSuccess(message) {
    const errorDiv = document.getElementById('passwordErrorMessage');
    const successDiv = document.getElementById('passwordSuccessMessage');
    
    if (errorDiv && successDiv) {
      successDiv.textContent = message;
      successDiv.classList.remove('d-none');
      errorDiv.classList.add('d-none');
    }
  }

  // Initialize profile page functionality
  function initProfilePage() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          nome: document.getElementById('nome').value,
          cognome: document.getElementById('cognome').value,
          email: document.getElementById('email').value,
          currentPassword: document.getElementById('currentPassword').value
        };
        
        await handleProfileUpdate(formData);
      });
    }

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
          currentPasswordForChange: document.getElementById('currentPasswordForChange').value,
          newPassword: document.getElementById('newPassword').value,
          confirmNewPassword: document.getElementById('confirmNewPassword').value
        };
        
        await handlePasswordUpdate(formData);
      });
    }
  }

  // Export profile functions
  window.Profile = {
    handleProfileUpdate,
    showProfileError,
    showProfileSuccess,
    handlePasswordUpdate,
    showPasswordError,
    showPasswordSuccess,
    initProfilePage
  };
})();
