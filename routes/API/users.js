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
    const { username, password, role, nome, cognome, email } = req.body;
    
    // Validazione campi obbligatori
    if (!username || !password || !role || !nome || !cognome || !email) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }
    
    // Validazione ruolo
    if (!['admin', 'trainer', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Ruolo non valido.' });
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
    
    const newId = await userDAO.createUser(username, password, role, nome, cognome, email);
    const created = await userDAO.getUserById(newId);
    res.status(201).json(created);
  } catch (err) {
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