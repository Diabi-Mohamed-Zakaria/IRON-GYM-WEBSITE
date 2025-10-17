'use strict';

const express = require('express');
const { ensureAuthenticated, ensureAdmin, ensureTrainer } = require('../../routes/auth');
const ClassDAO = require('../../models/class-dao');

const router = express.Router();

// GET /api/classes - elenco classi pubblico
router.get('/', async (req, res) => {
  try {
    const classDAO = new ClassDAO();
    const classes = await classDAO.getAllClasses();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/classes/trainer - classi del trainer corrente
router.get('/trainer', ensureAuthenticated, ensureTrainer, async (req, res) => {
  try {
    console.log(`Loading classes for trainer ID: ${req.user.id}`);
    const classDAO = new ClassDAO();
    const classes = await classDAO.getClassesByTrainer(req.user.id);
    console.log(`Found ${classes.length} classes for trainer ${req.user.id}:`, classes);
    res.json(classes);
  } catch (err) {
    console.error('Error loading trainer classes:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/classes/:id - dettaglio classe
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const classDAO = new ClassDAO();
    const cls = await classDAO.getClassById(id);
    if (cls && cls.error) return res.status(404).json(cls);
    res.json(cls);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/classes/search - cerca classi
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'Parametro q richiesto.' });
    const classDAO = new ClassDAO();
    const results = await classDAO.searchClasses(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/classes/:id/availability - disponibilità posti
router.get('/:id/availability', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const classDAO = new ClassDAO();
    const availability = await classDAO.getClassAvailability(id);
    if (availability && availability.error) return res.status(404).json(availability);
    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// POST /api/classes - crea nuova classe (admin/trainer)
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { name, trainer_id, time, capacity, day_of_week, description } = req.body;
    
    if (!name || !time || !capacity || !day_of_week) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti.' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
      return res.status(403).json({ error: 'Accesso negato.' });
    }
    
    const trainerId = trainer_id || req.user.id; // default trainer corrente
    const classDAO = new ClassDAO();
    const newId = await classDAO.createClass({ name, trainer_id: trainerId, time, capacity, day_of_week, description });
    const created = await classDAO.getClassById(newId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// PUT /api/classes/:id - aggiorna classe (admin/trainer)
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const classDAO = new ClassDAO();
    const ok = await classDAO.updateClass(id, req.body);
    if (!ok) return res.status(404).json({ error: 'Classe non trovata.' });
    const updated = await classDAO.getClassById(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// DELETE /api/classes/:id - elimina classe (admin)
router.delete('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const classDAO = new ClassDAO();
    const ok = await classDAO.deleteClass(id);
    if (!ok) return res.status(404).json({ error: 'Classe non trovata.' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

module.exports = router;