'use strict';

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const usersApi = require('./routes/API/users');
const classesApi = require('./routes/API/classes');
const bookingsApi = require('./routes/API/bookining');
const membershipsApi = require('./routes/API/memberships');
const paymentsApi = require('./routes/API/payments');
const reviewsApi = require('./routes/API/reviews');

const app = express();
const PORT = 3000;

// ==================== MIDDLEWARE ====================

// Parser per JSON e form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File statici (CSS, JS, immagini)
app.use(express.static(path.join(__dirname, 'public')));

// Configurazione sessione
app.use(session({
  secret: 'iron-gym-secret-key-2025', // Cambia in produzione!
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 ore
  }
}));

// Inizializza Passport
app.use(passport.initialize());
app.use(passport.session());

// ==================== TEMPLATE ENGINE ====================

// EJS server-side rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== ROUTES ====================

// Route autenticazione
app.use('/api/auth', authRoutes.router);

// Route API
app.use('/api/users', usersApi);
app.use('/api/classes', classesApi);
app.use('/api/bookings', bookingsApi);
app.use('/api/memberships', membershipsApi);
app.use('/api/payments', paymentsApi);
app.use('/api/reviews', reviewsApi);

// ==================== ROUTE PAGINE (EJS) ====================
const pagesRouter = require('./routes/pages');
app.use('/', pagesRouter);

// ==================== ERROR HANDLING ====================

// 404 - Not Found
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Risorsa non trovata.' });
  }
  return res.status(404).render('errore', { code: 404, message: 'Pagina non trovata' });
});

// Central Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Errore del server.' });
  }
  return res.status(500).render('errore', { code: 500, message: 'Si è verificato un errore' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🏋️ IRON GYM Server avviato su http://localhost:${PORT}`);
  console.log(`📂 File statici serviti da: ${path.join(__dirname, 'public')}`);
  console.log(`📄 Pagine HTML servite da: ${path.join(__dirname, 'client')}`);
});

module.exports = app;