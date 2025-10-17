'use strict';
const express = require('express');
const { ensureAuthenticated, ensureAdmin } = require('../../routes/auth');
const UserDAO = require('../../models/user-dao');
const router = express.Router();

// GET /api/users - tutti gli utenti (solo admin)
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const userDAO = new UserDAO();
    const users = await userDAO.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/users/role/:role - utenti per ruolo (solo admin)
router.get('/role/:role', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const role = req.params.role;
    if (!['admin', 'trainer', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido.' });
    }
    const userDAO = new UserDAO();
    const users = await userDAO.getUsersByRole(role);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/users/trainers - get all trainers (public endpoint for reviews)
router.get('/trainers', async (req, res) => {
  try {
    const userDAO = new UserDAO();
    const trainers = await userDAO.getUsersByRole('trainer');
    res.json({ trainers });
  } catch (err) {
    console.error('Error fetching trainers:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/users/:id - dettaglio utente (solo admin)
router.get('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userDAO = new UserDAO();
    const user = await userDAO.getUserById(id);
    if (user && user.error) return res.status(404).json(user);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// POST /api/users - crea nuovo utente (solo admin)
router.post('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { username, password, role, nome, cognome, email, gender } = req.body;
    
    // Validazione campi obbligatori
    if (!username || !password || !role || !nome || !cognome || !email || !gender) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }
    
    // Validazione ruolo
    if (!['admin', 'trainer', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido.' });
    }
    
    // Validazione gender
    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ error: 'Genere non valido.' });
    }
    
    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email non valida.' });
    }
    
    // Controlla se username già esistente
    const userDAO = new UserDAO();
    const existing = await userDAO.getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username già in uso.' });
    }
    
    const newId = await userDAO.createUser(username, password, role, nome, cognome, email, gender);
    const created = await userDAO.getUserById(newId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// PUT /api/users/profile - aggiorna profilo utente (utente autenticato)
router.put('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const { nome, cognome, email, currentPassword } = req.body;
    const userId = req.user.id;
    
    // Validazione campi obbligatori
    if (!nome || !cognome || !email || !currentPassword) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }
    
    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email non valida.' });
    }
    
    const userDAO = new UserDAO();
    
    // Verifica password corrente
    const currentUser = await userDAO.getUserById(userId);
    if (currentUser.error) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }
    
    // Verifica password corrente (per progetto scolastico - password in chiaro)
    if (currentUser.password !== currentPassword) {
      return res.status(400).json({ error: 'Password corrente non corretta.' });
    }
    
    // Controlla se email è già in uso da altri utenti
    const existingUser = await userDAO.getUserByUsername(currentUser.username);
    if (existingUser && existingUser.email === email && existingUser.id !== userId) {
      return res.status(409).json({ error: 'Email già in uso da un altro utente.' });
    }
    
    // Aggiorna profilo
    const updated = await userDAO.updateUser(userId, { nome, cognome, email });
    
    if (!updated) {
      return res.status(500).json({ error: 'Errore durante l\'aggiornamento del profilo.' });
    }
    
    // Restituisce i dati aggiornati
    const updatedUser = await userDAO.getUserById(userId);
    res.json(updatedUser);
  } catch (err) {
    console.error('Errore aggiornamento profilo:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// PUT /api/users/password - aggiorna password utente (utente autenticato)
router.put('/password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    
    // Validazione campi obbligatori
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }
    
    // Validazione lunghezza password
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nuova password deve essere di almeno 6 caratteri.' });
    }
    
    // Validazione conferma password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Le password non coincidono.' });
    }
    
    const userDAO = new UserDAO();
    
    // Verifica password corrente usando bcrypt
    const isCurrentPasswordValid = await userDAO.verifyCurrentPassword(userId, currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Password corrente non corretta.' });
    }
    
    // Verifica che la nuova password sia diversa da quella corrente
    const isSamePassword = await userDAO.comparePassword(newPassword, (await userDAO.getUserById(userId)).password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'La nuova password deve essere diversa da quella corrente.' });
    }
    
    // Aggiorna password (viene hashata automaticamente nel DAO)
    const updated = await userDAO.updatePassword(userId, newPassword);
    
    if (!updated) {
      return res.status(500).json({ error: 'Errore durante l\'aggiornamento della password.' });
    }
    
    res.json({ message: 'Password aggiornata con successo.' });
  } catch (err) {
    console.error('Errore aggiornamento password:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/users/search - search users by username or email (admin only)
router.get('/search', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query di ricerca deve essere di almeno 2 caratteri.' });
    }
    
    const userDAO = new UserDAO();
    const users = await userDAO.searchUsers(q.trim());
    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// DELETE /api/users/:id - elimina utente (solo admin)
router.delete('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // Impedisci di eliminare se stesso
    if (id === req.user.id) {
      return res.status(403).json({ error: 'Non puoi eliminare il tuo stesso account.' });
    }
    
    const userDAO = new UserDAO();
    const ok = await userDAO.deleteUser(id);
    if (!ok) return res.status(404).json({ error: 'Utente non trovato.' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

module.exports = router;