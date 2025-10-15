(() => {
  'use strict';

  // Prevent multiple initializations
  if (window.App && window.App.initialized) {
    return;
  }

  // Toast notifications
  function ensureToastRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function showToast(message, type = 'info', timeoutMs = 3000) {
    const root = ensureToastRoot();
    const el = document.createElement('div');
    el.textContent = message;
    el.className = `toast-element toast-${type}`;
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-fade-out');
      setTimeout(() => el.remove(), 220);
    }, timeoutMs);
  }

  // API wrapper with JSON defaults and error handling
  async function apiFetch(path, options = {}) {
    const init = Object.assign({
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    }, options);
    const res = await fetch(path, init);
    let data = null;
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    if (isJson) {
      try { data = await res.json(); } catch (_) { /* ignore parse */ }
    } else {
      try { data = await res.text(); } catch (_) { /* ignore parse */ }
    }
    if (!res.ok) {
      const msg = data && data.error ? data.error : (typeof data === 'string' && data) ? data : `Errore ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  const api = {
    get: (url) => apiFetch(url, { method: 'GET' }),
    post: (url, body) => apiFetch(url, { method: 'POST', body: JSON.stringify(body || {}) }),
    put: (url, body) => apiFetch(url, { method: 'PUT', body: JSON.stringify(body || {}) }),
    del: (url) => apiFetch(url, { method: 'DELETE' })
  };

  // Logout binding
  async function doLogout() {
    try {
      await api.post('/api/auth/logout', {});
      showToast('Logout effettuato', 'success');
      setTimeout(() => { window.location.href = '/'; }, 300);
    } catch (err) {
      showToast(err.message || 'Errore durante il logout', 'error');
    }
  }

  function bindLogout() {
    // Buttons/links with data-logout
    document.querySelectorAll('[data-logout]')
      .forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); doLogout(); }));

    // Intercept forms that post to /api/auth/logout
    document.querySelectorAll('form[action="/api/auth/logout"][method="POST"], form[action="/api/auth/logout"][method="post"]')
      .forEach(form => form.addEventListener('submit', (e) => { e.preventDefault(); doLogout(); }));
  }

  // Simple form validation
  const validators = {
    required: (v) => (v != null && String(v).trim().length > 0) || 'Campo obbligatorio',
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) || 'Email non valida'),
    minLen: (n) => (v) => (String(v || '').length >= n || `Minimo ${n} caratteri`)
  };

  function setFieldInvalid(input, message) {
    input.classList.add('is-invalid');
    let fb = input.nextElementSibling;
    if (!fb || !fb.classList.contains('invalid-feedback')) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      input.insertAdjacentElement('afterend', fb);
    }
    fb.textContent = message;
  }

  function clearFieldInvalid(input) {
    input.classList.remove('is-invalid');
    const fb = input.nextElementSibling;
    if (fb && fb.classList.contains('invalid-feedback')) fb.textContent = '';
  }

  // validateForm(form, rules) where rules: { fieldName: [validatorFn, ...] }
  function validateForm(form, rules) {
    let ok = true;
    Object.entries(rules || {}).forEach(([name, fns]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      clearFieldInvalid(input);
      const value = input.type === 'checkbox' ? input.checked : input.value;
      for (const fn of (Array.isArray(fns) ? fns : [fns])) {
        const res = typeof fn === 'function' ? fn(value) : true;
        if (res !== true) {
          setFieldInvalid(input, String(res));
          ok = false;
          break;
        }
      }
    });
    return ok;
  }

  // Index page specific functions
  function scrollToNext() {
    const heroSection = document.querySelector('.hero-section');
    const aboutSection = document.querySelector('.py-5.bg-dark');
    
    if (aboutSection) {
      aboutSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // Load trainers for review form
  async function loadTrainers() {
    try {
      const response = await api.get('/api/users/trainers');
      
      if (response.trainers) {
        const select = document.getElementById('trainerSelect');
        if (select) {
          select.innerHTML = '<option value="">Choose a trainer</option>' +
            response.trainers.map(trainer => 
              `<option value="${trainer.id}">${trainer.nome} ${trainer.cognome}</option>`
            ).join('');
        }
      }
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  }

  // Show review error message
  function showReviewError(message) {
    const errorDiv = document.getElementById('reviewError');
    const successDiv = document.getElementById('reviewSuccess');
    
    if (errorDiv && successDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('d-none');
      successDiv.classList.add('d-none');
    }
  }

  // Show review success message
  function showReviewSuccess(message) {
    const errorDiv = document.getElementById('reviewError');
    const successDiv = document.getElementById('reviewSuccess');
    
    if (errorDiv && successDiv) {
      successDiv.textContent = message;
      successDiv.classList.remove('d-none');
      errorDiv.classList.add('d-none');
    }
  }

  // Setup review form
  function setupReviewForm() {
    const reviewType = document.getElementById('reviewType');
    const trainerSelectDiv = document.getElementById('trainerSelectDiv');
    const submitBtn = document.getElementById('submitReview');
    
    if (!reviewType || !trainerSelectDiv || !submitBtn) return;
    
    // Show/hide trainer selection
    reviewType.addEventListener('change', function() {
      if (this.value === 'trainer') {
        trainerSelectDiv.classList.remove('trainer-select-hidden');
        document.getElementById('trainerSelect').required = true;
      } else {
        trainerSelectDiv.classList.add('trainer-select-hidden');
        document.getElementById('trainerSelect').required = false;
      }
    });
    
    // Submit review
    submitBtn.addEventListener('click', async function() {
      const reviewData = {
        rating: parseInt(document.querySelector('input[name="rating"]:checked')?.value),
        title: document.getElementById('reviewTitle').value,
        comment: document.getElementById('reviewComment').value,
        review_type: document.getElementById('reviewType').value,
        trainer_id: document.getElementById('trainerSelect').value || null
      };
      
      // Validation
      if (!reviewData.rating || !reviewData.title || !reviewData.comment || !reviewData.review_type) {
        showReviewError('Please fill in all required fields');
        return;
      }
      
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        showReviewError('Rating must be between 1 and 5 stars');
        return;
      }
      
      if (reviewData.title.length < 3 || reviewData.title.length > 100) {
        showReviewError('Title must be between 3 and 100 characters');
        return;
      }
      
      if (reviewData.comment.length < 10 || reviewData.comment.length > 500) {
        showReviewError('Comment must be between 10 and 500 characters');
        return;
      }
      
      if (reviewData.review_type === 'trainer' && !reviewData.trainer_id) {
        showReviewError('Please select a trainer');
        return;
      }
      
      try {
        const response = await api.post('/api/reviews', reviewData);
        
        showReviewSuccess('Review submitted successfully! Redirecting...');
        setTimeout(() => {
          window.location.reload(); // Reload page to show new review
        }, 1500);
      } catch (error) {
        console.error('Error submitting review:', error);
        showReviewError(error.message || 'Network error. Please try again.');
      }
    });
  }

  // Classes page specific functions
  function searchClasses() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const classItems = document.querySelectorAll('.class-item');
    
    classItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(query)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  async function bookClass(classId) {
    try {
      const response = await api.post('/api/bookings', { classId: classId });
      
      showToast('Class booked successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error booking class:', error);
      showToast(error.message || 'Error booking class. Please try again.', 'error');
    }
  }

  // Join page specific functions
  async function handleRegistration(formData) {
    const { nome, cognome, email, username, password, confirmPassword, role } = formData;
    
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
    
    // Validate passwords match
    if (password !== confirmPassword) {
      showRegistrationError('Passwords do not match!');
      return;
    }
    
    try {
      const response = await api.post('/api/auth/register', { 
        username, 
        password, 
        nome, 
        cognome, 
        email, 
        role 
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
          role: document.getElementById('role').value
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

  // Membership page specific functions
  const membershipPlans = {
    basic: {
      monthly: 29.99,
      annual: 299.99
    },
    premium: {
      monthly: 49.99,
      annual: 499.99
    },
    elite: {
      monthly: 79.99,
      annual: 799.99
    }
  };

  function updateMembershipPrices() {
    const billingPeriod = document.querySelector('input[name="billingPeriod"]:checked')?.value;
    if (!billingPeriod) return;
    
    Object.keys(membershipPlans).forEach(plan => {
      const price = membershipPlans[plan][billingPeriod];
      const priceElement = document.getElementById(`${plan}-price`);
      const periodElement = document.getElementById(`${plan}-period`);
      
      if (priceElement && periodElement) {
        priceElement.textContent = `€${price.toFixed(2)}`;
        periodElement.textContent = billingPeriod === 'monthly' ? '/month' : '/year';
      }
    });
  }

  async function selectPlan(planType, method) {
    try {
      const billingPeriod = document.querySelector('input[name="billingPeriod"]:checked')?.value;
      const price = membershipPlans[planType][billingPeriod];
      
      // Show loading state
      const buttons = document.querySelectorAll(`[onclick*="selectPlan('${planType}'"]`);
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processing...';
      });
      
      if (method === 'card') {
        // Simulate card payment processing
        const cardProcessed = await processCardPayment(planType, billingPeriod, price);
        if (!cardProcessed) {
          // Reset buttons if payment failed
          resetPlanButtons(buttons, planType);
          return;
        }
      }
      
      const response = await api.post('/api/memberships', { 
        planType, 
        billingPeriod, 
        paymentMethod: method 
      });
      
      // Show success message
      showPaymentSuccess(planType, method, price);
      setTimeout(() => { 
        window.location.href = '/client/dashboard'; 
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      showPaymentError(error.message || 'Errore di connessione. Riprova.');
      // Reset buttons
      const buttons = document.querySelectorAll(`[onclick*="selectPlan('${planType}'"]`);
      resetPlanButtons(buttons, planType);
    }
  }

  function resetPlanButtons(buttons, planType) {
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.innerHTML = btn.innerHTML.includes('cash') ? 
        '<i class="bi bi-cash"></i> Pay in Gym' : 
        '<i class="bi bi-credit-card"></i> Pay with Card';
    });
  }

  // Simulate card payment processing
  async function processCardPayment(planType, billingPeriod, amount) {
    return new Promise((resolve) => {
      // Show card payment modal
      showCardPaymentModal(planType, billingPeriod, amount, resolve);
    });
  }

  // Show card payment modal
  function showCardPaymentModal(planType, billingPeriod, amount, callback) {
    // Create modal HTML
    const modalHtml = `
      <div class="modal fade" id="cardPaymentModal" tabindex="-1" aria-labelledby="cardPaymentModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header border-secondary">
              <h5 class="modal-title" id="cardPaymentModalLabel">
                <i class="bi bi-credit-card text-warning"></i> Card Payment
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <h6>Plan: <span class="text-warning">${planType.toUpperCase()}</span></h6>
                <h6>Billing: <span class="text-warning">${billingPeriod}</span></h6>
                <h6>Amount: <span class="text-warning">€${amount.toFixed(2)}</span></h6>
              </div>
              <form id="cardPaymentForm">
                <div class="mb-3">
                  <label for="cardNumber" class="form-label">Card Number</label>
                  <input type="text" class="form-control" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" required>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="expiryDate" class="form-label">Expiry Date</label>
                    <input type="text" class="form-control" id="expiryDate" placeholder="MM/YY" maxlength="5" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="cvv" class="form-label">CVV</label>
                    <input type="text" class="form-control" id="cvv" placeholder="123" maxlength="3" required>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="cardholderName" class="form-label">Cardholder Name</label>
                  <input type="text" class="form-control" id="cardholderName" placeholder="John Doe" required>
                </div>
                <div id="cardPaymentError" class="alert alert-danger d-none" role="alert"></div>
              </form>
            </div>
            <div class="modal-footer border-secondary">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-warning" id="processCardPayment">
                <i class="bi bi-credit-card"></i> Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('cardPaymentModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('cardPaymentModal'));
    modal.show();
    
    // Setup form validation and processing
    setupCardPaymentForm(callback);
  }

  // Setup card payment form
  function setupCardPaymentForm(callback) {
    const form = document.getElementById('cardPaymentForm');
    const processBtn = document.getElementById('processCardPayment');
    const errorDiv = document.getElementById('cardPaymentError');
    
    // Format card number input
    const cardNumberInput = document.getElementById('cardNumber');
    cardNumberInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
      e.target.value = formattedValue;
    });
    
    // Format expiry date input
    const expiryInput = document.getElementById('expiryDate');
    expiryInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });
    
    // Format CVV input
    const cvvInput = document.getElementById('cvv');
    cvvInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });
    
    // Process payment
    processBtn.addEventListener('click', async function() {
      const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
      const expiryDate = document.getElementById('expiryDate').value;
      const cvv = document.getElementById('cvv').value;
      const cardholderName = document.getElementById('cardholderName').value;
      
      // Basic validation
      if (!cardNumber || cardNumber.length < 16) {
        showCardError('Please enter a valid card number');
        return;
      }
      
      if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showCardError('Please enter a valid expiry date (MM/YY)');
        return;
      }
      
      if (!cvv || cvv.length < 3) {
        showCardError('Please enter a valid CVV');
        return;
      }
      
      if (!cardholderName.trim()) {
        showCardError('Please enter cardholder name');
        return;
      }
      
      // Simulate payment processing
      processBtn.disabled = true;
      processBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processing...';
      
      // Simulate API call delay
      setTimeout(() => {
        // Simulate successful payment (in real app, this would be a real payment gateway)
        const modal = bootstrap.Modal.getInstance(document.getElementById('cardPaymentModal'));
        modal.hide();
        callback(true);
      }, 2000);
    });
    
    function showCardError(message) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('d-none');
    }
  }

  // Show payment success message
  function showPaymentSuccess(planType, method, amount) {
    const message = method === 'card' ? 
      `🎉 Payment successful! Your ${planType.toUpperCase()} membership (€${amount.toFixed(2)}) has been activated.` :
      `✅ Membership confirmed! Please visit the gym to complete your ${planType.toUpperCase()} membership payment (€${amount.toFixed(2)}).`;
    
    showToast(message, 'success', 5000);
  }

  // Show payment error message
  function showPaymentError(message) {
    showToast(message, 'error', 4000);
  }

  // Initialize membership page functionality
  function initMembershipPage() {
    const billingRadios = document.querySelectorAll('input[name="billingPeriod"]');
    billingRadios.forEach(radio => {
      radio.addEventListener('change', updateMembershipPrices);
    });
    
    // Initialize prices
    updateMembershipPrices();

    // Add event listeners for membership plan buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-plan][data-method]')) {
        const btn = e.target.closest('[data-plan][data-method]');
        const planType = btn.dataset.plan;
        const method = btn.dataset.method;
        selectPlan(planType, method);
      }
    });
  }

  // Payment status page specific functions
  async function loadPaymentStatusData() {
    try {
      // Load membership status
      const membership = await api.get('/api/memberships/me');
      displayMembershipStatus(membership);

      // Load payment history
      const payments = await api.get('/api/payments/my');
      displayPaymentHistory(payments);
    } catch (error) {
      console.error('Error loading payment data:', error);
      document.getElementById('membership-status').innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> Error loading membership information.
        </div>
      `;
      document.getElementById('payment-history').innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> Error loading payment history.
        </div>
      `;
    }
  }

  function displayMembershipStatus(membership) {
    if (!membership || membership === null) {
      document.getElementById('membership-status').innerHTML = `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i> No active membership found.
          <a href="/membership" class="btn btn-warning btn-sm ms-2">Get Membership</a>
        </div>
      `;
      return;
    }

    const statusClass = membership.status === 'active' ? 'success' : 
                       membership.status === 'expired' ? 'danger' : 'warning';
    
    const statusIcon = membership.status === 'active' ? 'check-circle' : 
                      membership.status === 'expired' ? 'x-circle' : 'clock';

    document.getElementById('membership-status').innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h5 class="text-white">${membership.plan_type.toUpperCase()} Plan</h5>
          <p class="text-secondary mb-1">Billing: ${membership.billing_period}</p>
          <p class="text-secondary mb-1">Price: €${membership.price}</p>
          <p class="text-secondary mb-0">Start Date: ${new Date(membership.start_date).toLocaleDateString()}</p>
        </div>
        <div class="col-md-6">
          <div class="text-end">
            <span class="badge bg-${statusClass} fs-6">
              <i class="bi bi-${statusIcon}"></i> ${membership.status.toUpperCase()}
            </span>
            <p class="text-secondary mt-2 mb-0">End Date: ${new Date(membership.end_date).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;
  }

  function displayPaymentHistory(payments) {
    if (!payments || payments.length === 0) {
      document.getElementById('payment-history').innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> No payment history found.
        </div>
      `;
      return;
    }

    const paymentsHtml = payments.map(payment => {
      const statusClass = payment.payment_status === 'completed' ? 'success' : 
                         payment.payment_status === 'failed' ? 'danger' : 
                         payment.payment_status === 'pending' ? 'warning' : 'secondary';
      
      const statusIcon = payment.payment_status === 'completed' ? 'check-circle' : 
                        payment.payment_status === 'failed' ? 'x-circle' : 
                        payment.payment_status === 'pending' ? 'clock' : 'question-circle';

      return `
        <div class="border-bottom py-3">
          <div class="row align-items-center">
            <div class="col-md-3">
              <strong class="text-white">€${payment.amount}</strong>
              <br>
              <small class="text-secondary">${payment.plan_type} - ${payment.billing_period}</small>
            </div>
            <div class="col-md-3">
              <span class="badge bg-${statusClass}">
                <i class="bi bi-${statusIcon}"></i> ${payment.payment_status.toUpperCase()}
              </span>
            </div>
            <div class="col-md-3">
              <small class="text-secondary">
                <i class="bi bi-calendar"></i> ${new Date(payment.payment_date).toLocaleDateString()}
              </small>
            </div>
            <div class="col-md-3">
              <small class="text-secondary">
                <i class="bi bi-${payment.payment_method === 'cash' ? 'cash' : 'credit-card'}"></i> 
                ${payment.payment_method.replace('_', ' ').toUpperCase()}
              </small>
            </div>
          </div>
          ${payment.notes ? `<small class="text-muted mt-1 d-block">${payment.notes}</small>` : ''}
        </div>
      `;
    }).join('');

    document.getElementById('payment-history').innerHTML = paymentsHtml;
  }

  // Initialize payment status page functionality
  function initPaymentStatusPage() {
    loadPaymentStatusData();
  }

  // Initialize classes page functionality
  function initClassesPage() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', searchClasses);
    }
    
    // Add event listeners for book class buttons
    const bookButtons = document.querySelectorAll('.book-class-btn');
    bookButtons.forEach(button => {
      button.addEventListener('click', function() {
        const classId = this.getAttribute('data-class-id');
        bookClass(classId);
      });
    });

    // Add event listener for search button
    const searchBtn = document.getElementById('search-classes-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', searchClasses);
    }
  }

  // Initialize index page functionality
  function initIndexPage() {
    // Load trainers and setup review form if user is a client
    if (document.getElementById('trainerSelect')) {
      loadTrainers();
      setupReviewForm();
    }

    // Add event listener for scroll arrow
    const scrollBtn = document.getElementById('scroll-to-next-btn');
    if (scrollBtn) {
      scrollBtn.addEventListener('click', scrollToNext);
    }

    // Add event listener for reload button
    const reloadBtn = document.getElementById('reload-page-btn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }

  // Global exposure
  window.App = { 
    api, 
    showToast, 
    doLogout, 
    bindLogout, 
    validateForm, 
    validators,
    scrollToNext,
    loadTrainers,
    showReviewError,
    showReviewSuccess,
    setupReviewForm,
    initIndexPage,
    searchClasses,
    bookClass,
    initClassesPage,
    handleRegistration,
    showRegistrationError,
    showRegistrationSuccess,
    initJoinPage,
    handleLogin,
    showLoginError,
    initLoginPage,
    selectPlan,
    updateMembershipPrices,
    processCardPayment,
    showCardPaymentModal,
    showPaymentSuccess,
    showPaymentError,
    initMembershipPage,
    loadPaymentStatusData,
    displayMembershipStatus,
    displayPaymentHistory,
    initPaymentStatusPage,
    initialized: true
  };

  // Auto-bind logout after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    bindLogout();
    initIndexPage();
    initClassesPage();
    initJoinPage();
    initLoginPage();
    initMembershipPage();
    
    // Initialize payment status page if we're on that page
    if (window.location.pathname === '/payment-status') {
      initPaymentStatusPage();
    }
  });
})();
