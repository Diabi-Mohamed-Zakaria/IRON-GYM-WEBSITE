(() => {
  'use strict';

  // Load trainers for review form
  async function loadTrainers() {
    try {
      const api = new Utils.ApiManager();
      const response = await api.get('/api/users/trainers');
      
      if (response.trainers) {
        const select = document.getElementById('trainerSelect');
        if (select) {
          // Clear existing options except the first one
          select.innerHTML = '<option value="">Choose a trainer</option>';
          
          // Add trainer options
          response.trainers.forEach(trainer => {
            const option = document.createElement('option');
            option.value = trainer.id;
            option.textContent = `${trainer.nome} ${trainer.cognome}`;
            select.appendChild(option);
          });
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
        const api = new Utils.ApiManager();
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

  // Export reviews functions
  window.Reviews = {
    loadTrainers,
    showReviewError,
    showReviewSuccess,
    setupReviewForm
  };
})();
