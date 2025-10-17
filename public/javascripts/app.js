(() => {
  'use strict';

  // Prevent multiple initializations
  if (window.App && window.App.initialized) {
    return;
  }

  // Initialize index page functionality
  function initIndexPage() {
    // Load trainers and setup review form if user is a client
    if (document.getElementById('trainerSelect')) {
      Reviews.loadTrainers();
      Reviews.setupReviewForm();
    }

    // Add event listener for scroll arrow
    const scrollBtn = document.getElementById('scroll-to-next-btn');
    if (scrollBtn) {
      scrollBtn.addEventListener('click', Utils.scrollToNext);
    }

    // Add event listener for reload button
    const reloadBtn = document.getElementById('reload-page-btn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }

  // Global exposure - Main App object
  window.App = { 
    // Core utilities
    showToast: Utils.showToast,
    doLogout: Utils.doLogout,
    bindLogout: Utils.bindLogout,
    validateForm: Utils.validateForm,
    validators: new Utils.Validator(),
    api: new Utils.ApiManager(),
    
    // Page initialization functions
    initIndexPage,
    initClassesPage: Classes.initClassesPage,
    initJoinPage: Auth.initJoinPage,
    initLoginPage: Auth.initLoginPage,
    initMembershipPage: Membership.initMembershipPage,
    initProfilePage: Profile.initProfilePage,
    initPaymentStatusPage: Payments.initPaymentStatusPage,
    
    // Utility functions
    scrollToNext: Utils.scrollToNext,
    
    // Authentication functions
    handleRegistration: Auth.handleRegistration,
    showRegistrationError: Auth.showRegistrationError,
    showRegistrationSuccess: Auth.showRegistrationSuccess,
    handleLogin: Auth.handleLogin,
    showLoginError: Auth.showLoginError,
    
    // Profile functions
    handleProfileUpdate: Profile.handleProfileUpdate,
    showProfileError: Profile.showProfileError,
    showProfileSuccess: Profile.showProfileSuccess,
    handlePasswordUpdate: Profile.handlePasswordUpdate,
    showPasswordError: Profile.showPasswordError,
    showPasswordSuccess: Profile.showPasswordSuccess,
    
    // Classes functions
    searchClasses: Classes.searchClasses,
    bookClass: Classes.bookClass,
    
    // Reviews functions
    loadTrainers: Reviews.loadTrainers,
    showReviewError: Reviews.showReviewError,
    showReviewSuccess: Reviews.showReviewSuccess,
    setupReviewForm: Reviews.setupReviewForm,
    
    // Membership functions
    selectPlan: Membership.selectPlan,
    updateMembershipPrices: Membership.updateMembershipPrices,
    processCardPayment: Membership.processCardPayment,
    showCardPaymentModal: Membership.showCardPaymentModal,
    showPaymentSuccess: Membership.showPaymentSuccess,
    showPaymentError: Membership.showPaymentError,
    
    // Payments functions
    loadPaymentStatusData: Payments.loadPaymentStatusData,
    displayMembershipStatus: Payments.displayMembershipStatus,
    displayPaymentHistory: Payments.displayPaymentHistory,
    
    initialized: true
  };

  // Auto-bind logout after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    Utils.bindLogout();
    initIndexPage();
    Classes.initClassesPage();
    Auth.initJoinPage();
    Auth.initLoginPage();
    Membership.initMembershipPage();
    Profile.initProfilePage();
    
    // Initialize payment status page if we're on that page
    if (window.location.pathname === '/payment-status') {
      Payments.initPaymentStatusPage();
    }
  });
})();