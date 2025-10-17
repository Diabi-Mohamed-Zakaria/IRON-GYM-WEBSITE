'use strict';

const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserDAO = require('../models/user-dao');

const router = express.Router();

// ==================== CONFIGURAZIONE PASSPORT ====================

// Strategia di autenticazione locale
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const userDAO = new UserDAO();
      const user = await userDAO.getUser(username);
      
      if (!user) {
        return done(null, false, { message: 'Username o password errati.' });
      }

      // Verifica password (confronto diretto per progetto scolastico)
      if (password !== user.password) {
        return done(null, false, { message: 'Username o password errati.' });
      }

      // Password corretta
      return done(null, user.user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serializzazione utente (salva in sessione)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione utente (recupera da sessione)
passport.deserializeUser(async (id, done) => {
  try {
    const userDAO = new UserDAO();
    const user = await userDAO.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ==================== MIDDLEWARE AUTENTICAZIONE ====================

/**
 * Verifica che l'utente sia autenticato
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // Per le pagine EJS, reindirizza al login
  if (req.accepts('html')) {
    return res.redirect('/login');
  }
  // Per le API, restituisci JSON
  res.status(401).json({ error: 'Non autenticato.' });
}

/**
 * Verifica che l'utente sia admin
 */
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Accesso negato. Solo admin.' });
}

/**
 * Verifica che l'utente sia trainer
 */
function ensureTrainer(req, res, next) {
  if (req.isAuthenticated() && (req.user.role === 'trainer' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).json({ error: 'Accesso negato. Solo trainer.' });
}

/**
 * Verifica che l'utente sia client
 */
function ensureClient(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'client') {
    return next();
  }
  res.status(403).json({ error: 'Accesso negato. Solo clienti.' });
}

// ==================== ROUTE AUTENTICAZIONE ====================

/**
 * GET /api/auth/session
 * Restituisce l'utente corrente (se loggato)
 */
router.get('/session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Non autenticato.' });
  }
});

/**
 * POST /api/auth/login
 * Login con username e password
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ error: info.message });
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json(user);
    });
  })(req, res, next);
});

/**
 * POST /api/auth/logout
 * Logout utente
 */
router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logout effettuato.' });
  });
});

/**
 * POST /api/auth/register
 * Registrazione nuovo utente
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, nome, cognome, email, role, gender } = req.body;

    console.log('Dati ricevuti per registrazione:', { username, nome, cognome, email, role, gender });

    // Validazione input
    if (!username || !password || !nome || !cognome || !email || !gender) {
      console.error('Errore: campi mancanti');
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }

    // Controlla che username non esista già
    const userDAO = new UserDAO();
    const existingUser = await userDAO.getUserByUsername(username);
    if (existingUser) {
      console.error('Errore: username già esistente');
      return res.status(400).json({ error: 'Username già esistente.' });
    }

    // Ruolo di default è 'client'
    const userRole = role || 'client';

    // Valida ruolo
    if (!['admin', 'trainer', 'client'].includes(userRole)) {
      console.error('Errore: ruolo non valido');
      return res.status(400).json({ error: 'Ruolo non valido.' });
    }

    // Valida gender
    if (!['male', 'female'].includes(gender)) {
      console.error('Errore: gender non valido');
      return res.status(400).json({ error: 'Genere non valido.' });
    }

    // Crea utente
    const userId = await userDAO.createUser(username, password, userRole, nome, cognome, email, gender);
    console.log('Utente creato con ID:', userId);

    // Login automatico dopo registrazione
    const newUser = await userDAO.getUserById(userId);
    req.login(newUser, (err) => {
      if (err) {
        console.error('Errore durante il login automatico:', err);
        return res.status(500).json({ error: 'Errore durante il login automatico.' });
      }
      console.log('Login automatico riuscito per utente:', newUser);
      return res.status(201).json(newUser);
    });
  } catch (err) {
    console.error('Errore durante la registrazione:', err);
    res.status(500).json({ error: 'Errore durante la registrazione.' });
  }
});

// ==================== EXPORT ====================

module.exports = {
  router,
  ensureAuthenticated,
  ensureAdmin,
  ensureTrainer,
  ensureClient
};