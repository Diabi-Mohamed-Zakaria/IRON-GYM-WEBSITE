(() => {
  'use strict';

  // Prevent multiple initializations
  if (window.TrainerDashboard && window.TrainerDashboard.initialized) {
    return;
  }

  // API utilities
  const api = {
    get: async (url) => {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Errore del server' }));
        throw new Error(error.error || 'Errore del server');
      }
      return response.json();
    },
    post: async (url, data) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Errore del server' }));
        throw new Error(error.error || 'Errore del server');
      }
      return response.json();
    },
    del: async (url) => {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Errore del server' }));
        throw new Error(error.error || 'Errore del server');
      }
      return response.text();
    }
  };

  // Toast utility
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show toast-notification`;
    toast.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  };

  // Funzioni CRUD per Trainer Dashboard
  const TrainerManager = {
    async loadClasses() {
      try {
        const classes = await api.get('/api/classes');
        this.renderClassesTable(classes);
        // Carica anche i conteggi delle prenotazioni per ogni classe
        classes.forEach(cls => this.loadBookingCount(cls.id));
      } catch (err) {
        showToast(err.message || 'Errore caricamento classi', 'error');
      }
    },

    renderClassesTable(classes) {
      const tbody = document.querySelector('#classes-table tbody');
      if (!tbody) return;
      
      if (!classes || classes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No classes assigned yet. Create your first class!</td></tr>';
        return;
      }

      tbody.innerHTML = classes.map(cls => `
        <tr>
          <td><strong>${cls.name}</strong></td>
          <td>${cls.day_of_week}</td>
          <td>${cls.time}</td>
          <td>${cls.capacity} people</td>
          <td>
            <span class="badge bg-info" id="bookings-count-${cls.id}">Loading...</span>
          </td>
          <td>
            <button class="btn btn-sm btn-primary view-bookings-btn" data-class-id="${cls.id}" data-class-name="${cls.name}">
              <i class="bi bi-eye"></i> View
            </button>
            <button class="btn btn-sm btn-danger delete-class-btn" data-class-id="${cls.id}" data-class-name="${cls.name}">
              <i class="bi bi-trash"></i> Delete
            </button>
          </td>
        </tr>
      `).join('');
    },

    async loadBookingCount(classId) {
      try {
        const bookings = await api.get(`/api/bookings/class/${classId}`);
        const countElement = document.getElementById(`bookings-count-${classId}`);
        if (countElement) {
          countElement.textContent = `${bookings.length} bookings`;
        }
      } catch (err) {
        console.error('Errore caricamento conteggio prenotazioni:', err);
        const countElement = document.getElementById(`bookings-count-${classId}`);
        if (countElement) {
          countElement.textContent = 'Error';
        }
      }
    },

    async deleteClass(id, name) {
      if (!confirm(`Sei sicuro di voler eliminare la classe "${name}"?`)) return;
      
      try {
        await api.del(`/api/classes/${id}`);
        showToast('Classe eliminata con successo', 'success');
        await this.loadClasses();
      } catch (err) {
        showToast(err.message || 'Errore durante l\'eliminazione', 'error');
      }
    },

    async viewBookings(classId, className) {
      try {
        const bookings = await api.get(`/api/bookings/class/${classId}`);
        
        // Mostra le prenotazioni in un modal o alert
        if (bookings.length === 0) {
          showToast(`Nessuna prenotazione per la classe "${className}"`, 'info');
          return;
        }

        const bookingList = bookings.map(b => 
          `• ${b.nome} ${b.cognome} (${b.email})`
        ).join('\n');

        alert(`Prenotazioni per "${className}":\n\n${bookingList}`);
      } catch (err) {
        showToast(err.message || 'Errore caricamento prenotazioni', 'error');
      }
    },

    async loadAllBookings() {
      try {
        // Carica tutte le prenotazioni per le classi del trainer
        const classes = await api.get('/api/classes');
        const allBookings = [];
        
        for (let cls of classes) {
          try {
            const bookings = await api.get(`/api/bookings/class/${cls.id}`);
            bookings.forEach(booking => {
              allBookings.push({
                ...booking,
                class_name: cls.name,
                day_of_week: cls.day_of_week,
                time: cls.time
              });
            });
          } catch (err) {
            console.error(`Errore caricamento prenotazioni per classe ${cls.id}:`, err);
          }
        }

        this.renderBookingsTable(allBookings);
      } catch (err) {
        showToast(err.message || 'Errore caricamento prenotazioni', 'error');
      }
    },

    renderBookingsTable(bookings) {
      const tbody = document.querySelector('#bookings-table tbody');
      if (!tbody) return;
      
      if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings found</td></tr>';
        return;
      }

      tbody.innerHTML = bookings.map(booking => `
        <tr>
          <td><strong>${booking.nome} ${booking.cognome}</strong></td>
          <td>${booking.class_name}</td>
          <td>${booking.day_of_week}</td>
          <td>${booking.time}</td>
          <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-info" onclick="alert('Contact: ${booking.email}')">
              <i class="bi bi-envelope"></i> Contact
            </button>
          </td>
        </tr>
      `).join('');
    },

    async createClass(formData) {
      try {
        await api.post('/api/classes', formData);
        showToast('Classe creata con successo', 'success');
        await this.loadClasses();
        return true;
      } catch (err) {
        showToast(err.message || 'Errore durante la creazione', 'error');
        return false;
      }
    }
  };

  // Gestione Modal Crea Classe
  function initCreateClassModal() {
    const form = document.getElementById('create-class-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: form.name.value.trim(),
        time: form.time.value,
        capacity: Number(form.capacity.value),
        day_of_week: form.day_of_week.value,
        description: form.description.value.trim()
      };

      const success = await TrainerManager.createClass(formData);
      if (success) {
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('createClassModal')).hide();
      }
    });
  }

  // Event listeners per i bottoni
  function setupEventListeners() {
    // Event listeners per eliminazione classi
    document.addEventListener('click', (e) => {
      if (e.target.closest('.delete-class-btn')) {
        const btn = e.target.closest('.delete-class-btn');
        const classId = btn.dataset.classId;
        const className = btn.dataset.className;
        TrainerManager.deleteClass(classId, className);
      }
    });

    // Event listeners per visualizzazione prenotazioni
    document.addEventListener('click', (e) => {
      if (e.target.closest('.view-bookings-btn')) {
        const btn = e.target.closest('.view-bookings-btn');
        const classId = btn.dataset.classId;
        const className = btn.dataset.className;
        TrainerManager.viewBookings(classId, className);
      }
    });
  }

  // Inizializzazione
  document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.TrainerDashboard && window.TrainerDashboard.initialized) {
      return;
    }

    // Carica dati iniziali
    TrainerManager.loadClasses();
    TrainerManager.loadAllBookings();

    // Inizializza modal
    initCreateClassModal();
    
    // Setup event listeners
    setupEventListeners();

    // Mark as initialized
    window.TrainerDashboard = { initialized: true };
  });
})();
