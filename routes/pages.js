'use strict';

const express = require('express');
const ClassDAO = require('../models/class-dao');
const UserDAO = require('../models/user-dao');
const BookingDAO = require('../models/booking-dao');
const MembershipDAO = require('../models/membership-dao');
const ReviewDAO = require('../models/review-dao');
const { ensureAuthenticated, ensureAdmin, ensureTrainer, ensureClient } = require('./auth');

const router = express.Router();

// ==================== ROUTE PUBBLICHE ====================

/**
 * GET / - Homepage pubblica
 */
router.get('/', async (req, res) => {
  try {
    const reviewDAO = new ReviewDAO();
    
    // Recupera le prime 6 recensioni per la homepage
    const reviews = await reviewDAO.getAllReviews();
    
    // Prendi solo le prime 6 recensioni
    const featuredReviews = reviews.slice(0, 6);
    
    res.render('index', {
      title: 'IRON GYM - Premium Fitness Experience',
      user: req.user || null,
      reviews: featuredReviews
    });
  } catch (err) {
    console.error('Errore nella homepage:', err);
    res.render('index', {
      title: 'IRON GYM - Premium Fitness Experience',
      user: req.user || null,
      reviews: []
    });
  }
});

/**
 * GET /classes - Pagina classi pubblica
 */
router.get('/classes', async (req, res) => {
  try {
    const classDAO = new ClassDAO();
    const classes = await classDAO.getAllClasses();
    res.render('classes', {
      title: 'Classes - IRON GYM',
      user: req.user || null,
      classes: classes
    });
  } catch (err) {
    console.error('Errore nel recupero delle classi:', err);
    res.status(500).render('errore', {
      title: 'Errore',
      user: req.user || null,
      code: 500,
      message: 'Errore nel caricamento delle classi.'
    });
  }
});

/**
 * GET /trainers - Pagina trainers pubblica
 */
router.get('/trainers', async (req, res) => {
  try {
    const userDAO = new UserDAO();
    const trainers = await userDAO.getUsersByRole('trainer');
    res.render('trainers', {
      title: 'Trainers - IRON GYM',
      user: req.user || null,
      trainers: trainers
    });
  } catch (err) {
    console.error('Errore nel recupero dei trainers:', err);
    res.status(500).render('errore', {
      title: 'Errore',
      user: req.user || null,
      code: 500,
      message: 'Errore nel caricamento dei trainers.'
    });
  }
});

/**
 * GET /login - Pagina login
 */
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('login', {
    title: 'Login - IRON GYM',
    user: null
  });
});

/**
 * GET /join - Pagina registrazione
 */
router.get('/join', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('join', {
    title: 'Join Us - IRON GYM',
    user: null
  });
});

// ==================== ROUTE PROTETTE ====================

/**
 * GET /dashboard - Redirect alla dashboard appropriata
 */
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  const role = req.user.role;
  
  if (role === 'admin') {
    res.redirect('/admin/dashboard');
  } else if (role === 'trainer') {
    res.redirect('/trainer/dashboard');
  } else if (role === 'client') {
    // Se non ha membership, porta alla scelta piano
    // (Placeholder: in futuro verificare membership da DB)
    res.redirect('/client/dashboard');
  } else {
    res.status(403).send('Ruolo non riconosciuto.');
  }
});

/**
 * GET /profile - Pagina profilo utente
 */
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const userDAO = new UserDAO();
    const user = await userDAO.getUserById(req.user.id);
    
    if (user.error) {
      return res.status(404).render('errore', {
        title: 'Errore',
        user: req.user,
        code: 404,
        message: 'Utente non trovato.'
      });
    }

    res.render('profile', {
      title: 'My Profile - IRON GYM',
      user: user
    });
  } catch (err) {
    console.error('Errore nel caricamento profilo:', err);
    res.status(500).render('errore', {
      title: 'Errore',
      user: req.user,
      code: 500,
      message: 'Errore nel caricamento del profilo.'
    });
  }
});
/**
 * GET /membership - Scelta piano
 */
router.get('/membership', ensureAuthenticated, (req, res) => {
  res.render('membership', { title: 'Membership - IRON GYM', user: req.user });
});

/**
 * GET /payment-status - Status pagamenti cliente
 */
router.get('/payment-status', ensureAuthenticated, ensureClient, (req, res) => {
  res.render('payment-status', { title: 'Payment Status - IRON GYM', user: req.user });
});


/**
 * GET /admin/dashboard - Dashboard amministratore
 */
router.get('/admin/dashboard', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const userDAO = new UserDAO();
    const classDAO = new ClassDAO();
    const bookingDAO = new BookingDAO();
    
    const totalMembers = (await userDAO.getUsersByRole('client')).length;
    const totalTrainers = (await userDAO.getUsersByRole('trainer')).length;
    const allClasses = await classDAO.getAllClasses();
    const allBookings = await bookingDAO.getAllBookings();
    const members = await userDAO.getUsersByRole('client');

    res.render('admin-dashboard', {
      title: 'Admin Dashboard - IRON GYM',
      user: req.user,
      stats: {
        totalMembers: totalMembers,
        classesToday: allClasses.length,
        activeTrainers: totalTrainers,
        revenue: 0 // Sarà aggiornato dinamicamente da JavaScript
      },
      members: members,
      classes: allClasses
    });
  } catch (err) {
    console.error('Errore nel caricamento dashboard admin:', err);
    res.status(500).render('errore', {
      title: 'Errore',
      user: req.user,
      code: 500,
      message: 'Errore nel caricamento della dashboard.'
    });
  }
});

/**
 * GET /trainer/dashboard - Dashboard trainer
 */
router.get('/trainer/dashboard', ensureAuthenticated, ensureTrainer, async (req, res) => {
  try {
    const classDAO = new ClassDAO();
    const bookingDAO = new BookingDAO();
    
    const trainerClasses = await classDAO.getClassesByTrainer(req.user.id);
    
    // Conta clienti attivi (chi ha prenotato le sue classi)
    let activeClients = new Set();
    for (let cls of trainerClasses) {
      const bookings = await bookingDAO.getBookingsByClass(cls.id);
      bookings.forEach(b => activeClients.add(b.email));
    }

    res.render('trainer-dashboard', {
      title: 'Trainer Dashboard - IRON GYM',
      user: req.user,
      stats: {
        activeClients: activeClients.size,
        todaySessions: trainerClasses.length,
        satisfaction: 95, // Da implementare
        hoursThisMonth: trainerClasses.length * 2 // Esempio
      },
      classes: trainerClasses
    });
  } catch (err) {
    console.error('Errore nel caricamento dashboard trainer:', err);
    res.status(500).render('errore', {
      title: 'Errore',
      user: req.user,
      code: 500,
      message: 'Errore nel caricamento della dashboard.'
    });
  }
});

/**
 * GET /client/dashboard - Dashboard cliente
 */
router.get('/client/dashboard', ensureAuthenticated, ensureClient, async (req, res) => {
  try {
    const bookingDAO = new BookingDAO();
    const classDAO = new ClassDAO();
    
    const userBookings = await bookingDAO.getBookingsByUser(req.user.id);
    const allClasses = await classDAO.getAllClasses();

    if (!userBookings || !Array.isArray(userBookings)) {
      console.error('Errore: userBookings non valido:', userBookings);
      throw new Error('Prenotazioni utente non valide.');
    }

    if (!allClasses || !Array.isArray(allClasses)) {
      console.error('Errore: allClasses non valido:', allClasses);
      throw new Error('Classi disponibili non valide.');
    }

    res.render('cliente-dashboard', {
      title: 'Member Dashboard - IRON GYM',
      user: req.user,
      stats: {
        classesThisMonth: userBookings.length,
        nextSession: userBookings[0] || null,
        fitnessScore: 85, // Da implementare
        caloriesBurned: userBookings.length * 500 // Esempio
      },
      bookings: userBookings,
      availableClasses: allClasses
    });
  } catch (err) {
    console.error('Errore nel caricamento dashboard cliente:', err);
    res.status(500).render('errore', {
      title: 'Errore',
      user: req.user,
      code: 500,
      message: 'Errore nel caricamento della dashboard.'
    });
  }
});

/**
 * GET /bookings - Le mie prenotazioni (cliente)
 */
router.get('/bookings', ensureAuthenticated, async (req, res) => {
  try {
    const bookingDAO = new BookingDAO();
    const userBookings = await bookingDAO.getBookingsByUser(req.user.id);
    res.render('bookings', {
      title: 'My Bookings - IRON GYM',
      user: req.user,
      bookings: userBookings
    });
  } catch (err) {
    console.error('Errore nel recupero prenotazioni:', err);
    res.status(500).render('errore', {
      title: 'Errore',
      user: req.user,
      code: 500,
      message: 'Errore nel caricamento delle prenotazioni.'
    });
  }
});

module.exports = router;