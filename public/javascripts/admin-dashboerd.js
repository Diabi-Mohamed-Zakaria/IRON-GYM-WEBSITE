(() => {
  'use strict';

  // Prevent multiple initializations
  if (window.AdminDashboard && window.AdminDashboard.initialized) {
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
    put: async (url, data) => {
      const response = await fetch(url, {
        method: 'PUT',
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

  // Funzioni CRUD per Classi
  const ClassManager = {
    async loadClasses() {
      try {
        const classes = await api.get('/api/classes');
        this.renderClassesTable(classes);
      } catch (err) {
        showToast(err.message || 'Errore caricamento classi', 'error');
      }
    },

    renderClassesTable(classes) {
      const tbody = document.querySelector('#classes-table tbody');
      if (!tbody) return;
      
      if (!classes || classes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nessuna classe trovata</td></tr>';
        return;
      }

      tbody.innerHTML = classes.map(cls => `
        <tr>
          <td>${cls.name}</td>
          <td>${cls.day_of_week}</td>
          <td>${cls.time}</td>
          <td>${cls.trainer_nome} ${cls.trainer_cognome}</td>
          <td>${cls.capacity}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-class-btn" data-class-id="${cls.id}" data-class-name="${cls.name}">
              <i class="bi bi-trash"></i> Elimina
            </button>
          </td>
        </tr>
      `).join('');
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

  // Funzioni CRUD per Utenti
  const UserManager = {
    async loadUsers() {
      try {
        console.log('Loading users...');
        const users = await api.get('/api/users');
        console.log('Users loaded:', users);
        
        // Carica anche le informazioni sui pagamenti per ogni utente
        const usersWithPayments = await Promise.all(users.map(async (user) => {
          if (user.role === 'client') {
            try {
              console.log(`Loading data for client ${user.id}...`);
              const payments = await api.get(`/api/payments/user/${user.id}`);
              const membership = await api.get(`/api/memberships/user/${user.id}`).catch(() => null);
              console.log(`User ${user.id} - Payments:`, payments, 'Membership:', membership);
              return { ...user, payments, membership };
            } catch (err) {
              console.error(`Error loading data for user ${user.id}:`, err);
              return { ...user, payments: [], membership: null };
            }
          }
          return user;
        }));
        
        console.log('Users with payments data:', usersWithPayments);
        this.renderUsersTable(usersWithPayments);
      } catch (err) {
        console.error('Error loading users:', err);
        showToast(err.message || 'Errore caricamento utenti', 'error');
      }
    },

    renderUsersTable(users) {
      const tbody = document.querySelector('#members-table tbody');
      if (!tbody) return;
      
      if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nessun utente trovato</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(user => {
        if (user.role !== 'client') {
          return `
            <tr>
              <td>${user.id}</td>
              <td>${user.nome} ${user.cognome}</td>
              <td>${user.email}</td>
              <td><span class="badge bg-secondary">${user.role.toUpperCase()}</span></td>
              <td><span class="badge bg-secondary">N/A</span></td>
              <td>
                <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}" data-user-name="${user.nome} ${user.cognome}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `;
        }

        const membership = user.membership;
        const payments = user.payments || [];
        const lastPayment = payments.find(p => p.payment_status === 'completed');
        const pendingPayment = payments.find(p => p.payment_status === 'pending');
        
        let paymentStatus = 'NO MEMBERSHIP';
        let statusClass = 'secondary';
        let showPaidButton = false;
        let showNotPaidButton = false;
        
        if (membership) {
          if (lastPayment) {
            paymentStatus = 'PAID';
            statusClass = 'success';
            showNotPaidButton = true; // Show "Not Paid" button for paid users
          } else if (pendingPayment) {
            paymentStatus = 'PENDING';
            statusClass = 'warning';
            showPaidButton = true; // Show "Paid" button for pending users
          } else {
            paymentStatus = 'NOT PAID';
            statusClass = 'danger';
            showPaidButton = true; // Show "Paid" button for unpaid users
          }
        }

        return `
          <tr>
            <td>${user.id}</td>
            <td>${user.nome} ${user.cognome}</td>
            <td>${user.email}</td>
            <td>
              ${membership ? 
                `<span class="badge bg-info">${membership.plan_type.toUpperCase()} - ${membership.billing_period}</span>` : 
                '<span class="badge bg-secondary">NO MEMBERSHIP</span>'
              }
            </td>
            <td>
              <span class="badge bg-${statusClass}">${paymentStatus}</span>
            </td>
            <td>
              ${membership ? 
                `<div class="btn-group btn-group-sm" role="group">
                  ${showPaidButton ? 
                    `<button class="btn btn-success mark-paid-btn" data-user-id="${user.id}" title="Mark as PAID">
                      <i class="bi bi-check-circle"></i> Paid
                    </button>` : ''
                  }
                  ${showNotPaidButton ? 
                    `<button class="btn btn-outline-danger mark-not-paid-btn" data-user-id="${user.id}" title="Mark as NOT PAID">
                      <i class="bi bi-x-circle"></i> Not Paid
                    </button>` : ''
                  }
                </div>` : ''
              }
              <button class="btn btn-sm btn-danger ms-1 delete-user-btn" data-user-id="${user.id}" data-user-name="${user.nome} ${user.cognome}" title="Delete User">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    },

    async markAsPaid(userId) {
      const user = await api.get(`/api/users/${userId}`);
      const membership = await api.get(`/api/memberships/user/${userId}`).catch(() => null);
      
      if (!membership) {
        showToast('User has no membership', 'warning');
        return;
      }
      
      const confirmMessage = `Confirm payment for ${user.nome} ${user.cognome}?\n\nMembership: ${membership.plan_type.toUpperCase()} - ${membership.billing_period}\nAmount: €${membership.price}`;
      
      if (!confirm(confirmMessage)) return;
      
      try {
        // Trova il pagamento pending per questo utente
        const payments = await api.get(`/api/payments/user/${userId}`);
        const pendingPayment = payments.find(p => p.payment_status === 'pending');
        
        if (pendingPayment) {
          await api.put(`/api/payments/${pendingPayment.id}/status`, { 
            status: 'completed', 
            notes: `Payment confirmed by admin on ${new Date().toLocaleDateString()}` 
          });
          showToast(`${user.nome} ${user.cognome} marked as PAID successfully`, 'success');
          await this.loadUsers();
        } else {
          // Se non c'è un pagamento pending, creane uno nuovo
          await api.post('/api/payments', {
            userId: userId,
            membershipId: membership.id,
            amount: membership.price,
            paymentMethod: 'cash',
            status: 'completed',
            notes: `Payment confirmed by admin on ${new Date().toLocaleDateString()}`
          });
          showToast(`${user.nome} ${user.cognome} marked as PAID successfully`, 'success');
          await this.loadUsers();
        }
      } catch (err) {
        showToast(err.message || 'Error marking as paid', 'error');
      }
    },

    async markAsNotPaid(userId) {
      const user = await api.get(`/api/users/${userId}`);
      
      if (!confirm(`Mark ${user.nome} ${user.cognome} as NOT PAID?`)) return;
      
      try {
        const payments = await api.get(`/api/payments/user/${userId}`);
        const completedPayment = payments.find(p => p.payment_status === 'completed');
        
        if (completedPayment) {
          await api.put(`/api/payments/${completedPayment.id}/status`, { 
            status: 'failed', 
            notes: `Payment marked as failed by admin on ${new Date().toLocaleDateString()}` 
          });
          showToast(`${user.nome} ${user.cognome} marked as NOT PAID`, 'warning');
          await this.loadUsers();
        } else {
          showToast('No completed payment found for this user', 'warning');
        }
      } catch (err) {
        showToast(err.message || 'Error marking as not paid', 'error');
      }
    },

    getRoleBadge(role) {
      const badges = {
        admin: 'danger',
        trainer: 'warning',
        client: 'success'
      };
      return badges[role] || 'secondary';
    },

    async deleteUser(id, username) {
      if (!confirm(`Sei sicuro di voler eliminare l'utente "${username}"?`)) return;
      
      try {
        await api.del(`/api/users/${id}`);
        showToast('Utente eliminato con successo', 'success');
        await this.loadUsers();
      } catch (err) {
        showToast(err.message || 'Errore durante l\'eliminazione', 'error');
      }
    },

    async createUser(formData) {
      try {
        await api.post('/api/users', formData);
        showToast('Utente creato con successo', 'success');
        await this.loadUsers();
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
        trainer_id: Number(form.trainer_id.value),
        time: form.time.value,
        capacity: Number(form.capacity.value),
        day_of_week: form.day_of_week.value,
        description: form.description.value.trim()
      };

      const success = await ClassManager.createClass(formData);
      if (success) {
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('createClassModal')).hide();
      }
    });
  }

  // Gestione Modal Crea Utente
  function initCreateUserModal() {
    const form = document.getElementById('create-user-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        username: form.username.value.trim(),
        password: form.password.value,
        role: form.role.value,
        nome: form.nome.value.trim(),
        cognome: form.cognome.value.trim(),
        email: form.email.value.trim()
      };

      // Validazione password
      if (formData.password.length < 6) {
        App.showToast('La password deve essere di almeno 6 caratteri', 'error');
        return;
      }

      const success = await UserManager.createUser(formData);
      if (success) {
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
      }
    });
  }

  // Carica trainers per dropdown
  async function loadTrainers() {
    try {
      const trainers = await api.get('/api/users/role/trainer');
      const select = document.getElementById('trainer_id');
      if (!select) return;
      
      select.innerHTML = trainers.map(t => 
        `<option value="${t.id}">${t.nome} ${t.cognome}</option>`
      ).join('');
    } catch (err) {
      console.error('Errore caricamento trainers:', err);
    }
  }

  // Funzioni per Dashboard Stats
  const DashboardStats = {
    async loadRevenueStats() {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        // Carica revenue del mese corrente
        const currentRevenue = await api.get(`/api/payments/revenue/${year}/${month}`);
        
        // Carica revenue del mese precedente per calcolare la crescita
        let previousMonth = month - 1;
        let previousYear = year;
        if (previousMonth === 0) {
          previousMonth = 12;
          previousYear = year - 1;
        }
        
        const previousRevenue = await api.get(`/api/payments/revenue/${previousYear}/${previousMonth}`);
        
        // Calcola totali
        const currentTotal = currentRevenue.reduce((sum, item) => sum + (parseFloat(item.total_revenue) || 0), 0);
        const previousTotal = previousRevenue.reduce((sum, item) => sum + (parseFloat(item.total_revenue) || 0), 0);
        
        // Calcola percentuale di crescita
        let growthPercentage = 0;
        if (previousTotal > 0) {
          growthPercentage = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else if (currentTotal > 0) {
          growthPercentage = 100; // Nuovo revenue, crescita del 100%
        }
        
        // Aggiorna il DOM
        this.updateRevenueDisplay(currentTotal, growthPercentage);
        
      } catch (err) {
        console.error('Error loading revenue stats:', err);
        // In caso di errore, mostra valori di default
        this.updateRevenueDisplay(0, 0);
      }
    },

    updateRevenueDisplay(revenue, growth) {
      // Aggiorna l'amount del revenue
      const revenueAmountElement = document.getElementById('revenue-amount');
      if (revenueAmountElement) {
        revenueAmountElement.textContent = `${revenue.toFixed(2)} €`;
      }
      
      // Aggiorna il badge di crescita
      const revenueGrowthElement = document.getElementById('revenue-growth');
      if (revenueGrowthElement) {
        if (growth > 0) {
          revenueGrowthElement.className = 'badge bg-success';
          revenueGrowthElement.textContent = `+${growth.toFixed(1)}% this month`;
        } else if (growth < 0) {
          revenueGrowthElement.className = 'badge bg-danger';
          revenueGrowthElement.textContent = `${growth.toFixed(1)}% this month`;
        } else {
          revenueGrowthElement.className = 'badge bg-secondary';
          revenueGrowthElement.textContent = '0% this month';
        }
      }
    }
  };

  // Event listeners per i bottoni
  function setupEventListeners() {
    // Event listeners per eliminazione classi
    document.addEventListener('click', (e) => {
      if (e.target.closest('.delete-class-btn')) {
        const btn = e.target.closest('.delete-class-btn');
        const classId = btn.dataset.classId;
        const className = btn.dataset.className;
        ClassManager.deleteClass(classId, className);
      }
    });

    // Event listeners per eliminazione utenti
    document.addEventListener('click', (e) => {
      if (e.target.closest('.delete-user-btn')) {
        const btn = e.target.closest('.delete-user-btn');
        const userId = btn.dataset.userId;
        const userName = btn.dataset.userName;
        UserManager.deleteUser(userId, userName);
      }
    });

    // Event listeners per mark as paid
    document.addEventListener('click', (e) => {
      if (e.target.closest('.mark-paid-btn')) {
        const btn = e.target.closest('.mark-paid-btn');
        const userId = btn.dataset.userId;
        UserManager.markAsPaid(userId);
      }
    });

    // Event listeners per mark as not paid
    document.addEventListener('click', (e) => {
      if (e.target.closest('.mark-not-paid-btn')) {
        const btn = e.target.closest('.mark-not-paid-btn');
        const userId = btn.dataset.userId;
        UserManager.markAsNotPaid(userId);
      }
    });

    // Event listeners per navigazione admin
    const adminBrowseClassesBtn = document.getElementById('admin-browse-classes-btn');
    if (adminBrowseClassesBtn) {
      adminBrowseClassesBtn.addEventListener('click', () => {
        window.location.href = '/classes';
      });
    }

    const adminViewTrainersBtn = document.getElementById('admin-view-trainers-btn');
    if (adminViewTrainersBtn) {
      adminViewTrainersBtn.addEventListener('click', () => {
        window.location.href = '/trainers';
      });
    }
  }

  // Inizializzazione
  document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (window.AdminDashboard && window.AdminDashboard.initialized) {
      return;
    }

    // Carica dati iniziali
    ClassManager.loadClasses();
    UserManager.loadUsers();
    loadTrainers();
    DashboardStats.loadRevenueStats();

    // Inizializza modal
    initCreateClassModal();
    initCreateUserModal();
    
    // Setup event listeners
    setupEventListeners();

    // Mark as initialized
    window.AdminDashboard = { initialized: true };
  });
})();