(() => {
  'use strict';

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
      const api = new Utils.ApiManager();
      const response = await api.post('/api/bookings', { class_id: classId });
      
      Utils.showToast('Class booked successfully!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error booking class:', error);
      Utils.showToast(error.message || 'Error booking class. Please try again.', 'error');
    }
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

  // Export classes functions
  window.Classes = {
    searchClasses,
    bookClass,
    initClassesPage
  };
})();
