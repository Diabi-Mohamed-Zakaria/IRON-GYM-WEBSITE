(() => {
  'use strict';

  // ES6 Class for Membership Plans
  class MembershipPlans {
    constructor() {
      this.basic = {
        monthly: 29.99,
        annual: 299.99
      };
      this.premium = {
        monthly: 49.99,
        annual: 499.99
      };
      this.elite = {
        monthly: 79.99,
        annual: 799.99
      };
    }
  }

  function updateMembershipPrices() {
    const billingPeriod = document.querySelector('input[name="billingPeriod"]:checked')?.value;
    if (!billingPeriod) return;
    
    const membershipPlans = new MembershipPlans();
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
      const membershipPlans = new MembershipPlans();
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
      
      const api = new Utils.ApiManager();
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
    // Update modal content with plan details
    document.getElementById('modal-plan-type').textContent = planType.toUpperCase();
    document.getElementById('modal-billing-period').textContent = billingPeriod;
    document.getElementById('modal-amount').textContent = `€${amount.toFixed(2)}`;
    
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
    
    Utils.showToast(message, 'success', 5000);
  }

  // Show payment error message
  function showPaymentError(message) {
    Utils.showToast(message, 'error', 4000);
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

  // Export membership functions
  window.Membership = {
    MembershipPlans,
    updateMembershipPrices,
    selectPlan,
    processCardPayment,
    showCardPaymentModal,
    showPaymentSuccess,
    showPaymentError,
    initMembershipPage
  };
})();
