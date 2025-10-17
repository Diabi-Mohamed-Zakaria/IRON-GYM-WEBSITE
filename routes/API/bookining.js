'use strict';

const express = require('express');
const { ensureAuthenticated, ensureAdmin, ensureTrainer } = require('../../routes/auth');
const BookingDAO = require('../../models/booking-dao');
const ClassDAO = require('../../models/class-dao');

const router = express.Router();

// POST /api/bookings - crea prenotazione (utente loggato)
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { class_id } = req.body;
    if (!class_id) return res.status(400).json({ error: 'class_id richiesto.' });
    const bookingDAO = new BookingDAO();
    const id = await bookingDAO.createBooking(req.user.id, Number(class_id));
    const items = await bookingDAO.getBookingsByUser(req.user.id);
    res.status(201).json({ id, items });
  } catch (err) {
    const status = err && err.error ? 400 : 500;
    res.status(status).json(err && err.error ? err : { error: 'Errore del server.' });
  }
});

// GET /api/bookings/me - mie prenotazioni
router.get('/me', ensureAuthenticated, async (req, res) => {
  try {
    const bookingDAO = new BookingDAO();
    const items = await bookingDAO.getBookingsByUser(req.user.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/bookings/class/:classId - prenotazioni per classe (solo admin)
router.get('/class/:classId', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const bookingDAO = new BookingDAO();
    const items = await bookingDAO.getBookingsByClass(classId);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/bookings/trainer/class/:classId - prenotazioni per classe del trainer (solo trainer per le proprie classi)
router.get('/trainer/class/:classId', ensureAuthenticated, ensureTrainer, async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    console.log(`Loading bookings for class ${classId} by trainer ${req.user.id}`);
    const classDAO = new ClassDAO();
    const bookingDAO = new BookingDAO();
    
    // Verifica che la classe appartenga al trainer
    const classData = await classDAO.getClassById(classId);
    console.log(`Class data for ID ${classId}:`, classData);
    if (!classData || classData.trainer_id !== req.user.id) {
      console.log(`Access denied: class trainer_id ${classData?.trainer_id} !== user id ${req.user.id}`);
      return res.status(403).json({ error: 'Accesso negato. Puoi vedere solo le prenotazioni delle tue classi.' });
    }
    
    const items = await bookingDAO.getBookingsByClass(classId);
    console.log(`Found ${items.length} bookings for class ${classId}:`, items);
    res.json(items);
  } catch (err) {
    console.error('Error loading trainer class bookings:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// DELETE /api/bookings/:bookingId - cancella propria prenotazione
router.delete('/:bookingId', ensureAuthenticated, async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const bookingDAO = new BookingDAO();
    const ok = await bookingDAO.deleteBooking(bookingId, req.user.id);
    if (!ok) return res.status(404).json({ error: 'Prenotazione non trovata.' });
    res.status(204).end();
  } catch (err) {
    const status = err && err.error ? 400 : 500;
    res.status(status).json(err && err.error ? err : { error: 'Errore del server.' });
  }
});

module.exports = router;


