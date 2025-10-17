(() => {
  'use strict';

  // Prevent multiple initializations
  if (window.ClientDashboard && window.ClientDashboard.initialized) {
    return;
  }

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

  // ES6 Class for Client Manager
  class ClientManager {
    constructor() {
      // API utilities as class properties
      this.api = {
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
    }
    async loadBookings() {
      try {
        const bookings = await this.api.get('/api/bookings/me');
        this.renderBookingsTable(bookings);
      } catch (err) {
        showToast(err.message || 'Errore caricamento prenotazioni', 'error');
      }
    }

    renderBookingsTable(bookings) {
      const tbody = document.querySelector('#bookings-table tbody');
      if (!tbody) return;
      
      if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings yet. <a href="/classes" class="text-warning">Book your first class!</a></td></tr>';
        return;
      }

      tbody.innerHTML = bookings.map(booking => `
        <tr>
          <td><strong>${booking.class_name}</strong></td>
          <td>${booking.day_of_week}</td>
          <td>${booking.time}</td>
          <td>${booking.trainer_nome} ${booking.trainer_cognome}</td>
          <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-danger cancel-booking-btn" data-booking-id="${booking.id}" data-class-name="${booking.class_name}">
              <i class="bi bi-x-circle"></i> Cancel
            </button>
          </td>
        </tr>
      `).join('');
    }

    async cancelBooking(id, className) {
      if (!confirm(`Sei sicuro di voler cancellare la prenotazione per "${className}"?`)) return;
      
      try {
        await this.api.del(`/api/bookings/${id}`);
        showToast('Prenotazione cancellata con successo', 'success');
        await this.loadBookings();
      } catch (err) {
        showToast(err.message || 'Errore durante la cancellazione', 'error');
      }
    }

    async loadAvailableClasses() {
      try {
        const classes = await this.api.get('/api/classes');
        this.renderAvailableClassesTable(classes);
      } catch (err) {
        showToast(err.message || 'Errore caricamento classi', 'error');
      }
    }

    renderAvailableClassesTable(classes) {
      const tbody = document.querySelector('#available-classes-table tbody');
      if (!tbody) return;
      
      if (!classes || classes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nessuna classe disponibile</td></tr>';
        return;
      }

      tbody.innerHTML = classes.map(cls => `
        <tr>
          <td><strong>${cls.name}</strong></td>
          <td>${cls.day_of_week}</td>
          <td>${cls.time}</td>
          <td>${cls.trainer_nome} ${cls.trainer_cognome}</td>
          <td>${cls.capacity} people</td>
          <td>
            <button class="btn btn-sm btn-warning book-class-btn" data-class-id="${cls.id}" data-class-name="${cls.name}">
              <i class="bi bi-calendar-plus"></i> Book
            </button>
          </td>
        </tr>
      `).join('');
    }

    async bookClass(id, className) {
      if (!confirm(`Sei sicuro di voler prenotare la classe "${className}"?`)) return;
      
      try {
        await this.api.post('/api/bookings', { class_id: id });
        showToast('Classe prenotata con successo', 'success');
        await this.loadBookings();
        await this.loadAvailableClasses();
      } catch (err) {
        showToast(err.message || 'Errore durante la prenotazione', 'error');
      }
    }
  }

  // Event listeners per i bottoni
  function setupEventListeners(clientManager) {
    // Event listeners per cancellazione prenotazioni
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cancel-booking-btn')) {
        const btn = e.target.closest('.cancel-booking-btn');
        const bookingId = btn.dataset.bookingId;
        const className = btn.dataset.className;
        clientManager.cancelBooking(bookingId, className);
      }
    });

    // Event listeners per prenotazione classi
    document.addEventListener('click', (e) => {
      if (e.target.closest('.book-class-btn')) {
        const btn = e.target.closest('.book-class-btn');
        const classId = btn.dataset.classId;
        const className = btn.dataset.className;
        clientManager.bookClass(classId, className);
      }
    });

    // Event listeners per navigazione
    const bookNewClassBtn = document.getElementById('book-new-class-btn');
    if (bookNewClassBtn) {
      bookNewClassBtn.addEventListener('click', () => {
        window.location.href = '/classes';
      });
    }

    const refreshClassesBtn = document.getElementById('refresh-classes-btn');
    if (refreshClassesBtn) {
      refreshClassesBtn.addEventListener('click', () => {
        clientManager.loadAvailableClasses();
      });
    }

    const browseClassesBtn = document.getElementById('browse-classes-btn');
    if (browseClassesBtn) {
      browseClassesBtn.addEventListener('click', () => {
        window.location.href = '/classes';
      });
    }

    const viewTrainersBtn = document.getElementById('view-trainers-btn');
    if (viewTrainersBtn) {
      viewTrainersBtn.addEventListener('click', () => {
        window.location.href = '/trainers';
      });
    }

    const viewMembershipBtn = document.getElementById('view-membership-btn');
    if (viewMembershipBtn) {
      viewMembershipBtn.addEventListener('click', () => {
        window.location.href = '/payment-status';
      });
    }
  }

  // Inizializzazione
  document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.ClientDashboard && window.ClientDashboard.initialized) {
      return;
    }

    // Create instance of ClientManager
    const clientManager = new ClientManager();

    // Carica dati iniziali
    clientManager.loadBookings();
    clientManager.loadAvailableClasses();
    
    // Setup event listeners
    setupEventListeners(clientManager);

    // Mark as initialized
    window.ClientDashboard = { initialized: true };
  });
})();
