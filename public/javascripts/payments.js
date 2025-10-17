(() => {
  'use strict';

  // Payment status page specific functions
  async function loadPaymentStatusData() {
    try {
      const api = new Utils.ApiManager();
      // Load membership status
      const membership = await api.get('/api/memberships/me');
      displayMembershipStatus(membership);

      // Load payment history
      const payments = await api.get('/api/payments/my');
      displayPaymentHistory(payments);
    } catch (error) {
      console.error('Error loading payment data:', error);
      
      // Hide loading spinners
      document.getElementById('membership-status').style.display = 'none';
      document.getElementById('payment-history').style.display = 'none';
      
      // Show error messages
      document.getElementById('membership-status-error').classList.remove('d-none');
      document.getElementById('payment-history-error').classList.remove('d-none');
    }
  }

  function displayMembershipStatus(membership) {
    // Hide loading spinner
    document.getElementById('membership-status').style.display = 'none';
    
    if (!membership || membership === null) {
      document.getElementById('membership-status-no-active').classList.remove('d-none');
      return;
    }

    const statusClass = membership.status === 'active' ? 'success' : 
                       membership.status === 'expired' ? 'danger' : 'warning';
    
    const statusIcon = membership.status === 'active' ? 'check-circle' : 
                      membership.status === 'expired' ? 'x-circle' : 'clock';

    // Update template with membership data
    document.getElementById('membership-plan-type').textContent = `${membership.plan_type.toUpperCase()} Plan`;
    document.getElementById('membership-billing-period').textContent = membership.billing_period;
    document.getElementById('membership-price').textContent = `€${membership.price}`;
    document.getElementById('membership-start-date').textContent = new Date(membership.start_date).toLocaleDateString();
    document.getElementById('membership-end-date').textContent = new Date(membership.end_date).toLocaleDateString();
    document.getElementById('membership-status-text').textContent = membership.status.toUpperCase();
    
    // Update badge classes and icon
    const badge = document.getElementById('membership-status-badge');
    badge.className = `badge bg-${statusClass} fs-6`;
    const icon = badge.querySelector('i');
    icon.className = `bi bi-${statusIcon}`;
    
    // Show the active membership template
    document.getElementById('membership-status-active').classList.remove('d-none');
  }

  function displayPaymentHistory(payments) {
    // Hide loading spinner
    document.getElementById('payment-history').style.display = 'none';
    
    if (!payments || payments.length === 0) {
      document.getElementById('payment-history-empty').classList.remove('d-none');
      return;
    }

    const paymentsContainer = document.getElementById('payment-history-list');
    paymentsContainer.innerHTML = ''; // Clear existing content
    
    payments.forEach(payment => {
      const statusClass = payment.payment_status === 'completed' ? 'success' : 
                         payment.payment_status === 'failed' ? 'danger' : 
                         payment.payment_status === 'pending' ? 'warning' : 'secondary';
      
      const statusIcon = payment.payment_status === 'completed' ? 'check-circle' : 
                        payment.payment_status === 'failed' ? 'x-circle' : 
                        payment.payment_status === 'pending' ? 'clock' : 'question-circle';

      const methodIcon = payment.payment_method === 'cash' ? 'cash' : 'credit-card';
      const methodText = payment.payment_method.replace('_', ' ').toUpperCase();

      // Clone the template
      const template = document.getElementById('payment-item-template');
      const paymentItem = template.cloneNode(true);
      paymentItem.classList.remove('d-none');
      paymentItem.id = ''; // Remove template ID
      
      // Update template content
      paymentItem.querySelector('.payment-amount').textContent = `€${payment.amount}`;
      paymentItem.querySelector('.payment-plan-info').textContent = `${payment.plan_type} - ${payment.billing_period}`;
      paymentItem.querySelector('.payment-status-text').textContent = payment.payment_status.toUpperCase();
      paymentItem.querySelector('.payment-date').textContent = new Date(payment.payment_date).toLocaleDateString();
      paymentItem.querySelector('.payment-method-text').textContent = methodText;
      
      // Update badge and icon classes
      const badge = paymentItem.querySelector('.payment-status-badge');
      badge.className = `badge bg-${statusClass}`;
      const statusIconEl = paymentItem.querySelector('.payment-status-icon');
      statusIconEl.className = `bi bi-${statusIcon}`;
      const methodIconEl = paymentItem.querySelector('.payment-method-icon');
      methodIconEl.className = `bi bi-${methodIcon}`;
      
      // Add notes if available
      const notesEl = paymentItem.querySelector('.payment-notes');
      if (payment.notes) {
        notesEl.textContent = payment.notes;
      } else {
        notesEl.style.display = 'none';
      }
      
      paymentsContainer.appendChild(paymentItem);
    });

    // Show the payments list
    document.getElementById('payment-history-list').classList.remove('d-none');
  }

  // Initialize payment status page functionality
  function initPaymentStatusPage() {
    loadPaymentStatusData();
  }

  // Export payments functions
  window.Payments = {
    loadPaymentStatusData,
    displayMembershipStatus,
    displayPaymentHistory,
    initPaymentStatusPage
  };
})();
