'use strict';

const express = require('express');
const MembershipDAO = require('../../models/membership-dao');
const { ensureAuthenticated, ensureAdmin } = require('../auth');

const router = express.Router();

// GET /api/payments/user/:userId - get payments for a specific user (admin only or own payments)
router.get('/user/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own payments, admins can see all
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Accesso negato.' });
    }
    
    const membershipDAO = new MembershipDAO();
    const payments = await membershipDAO.getPaymentsByUser(parseInt(userId));
    res.json(payments);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/payments/my - get current user's payments
router.get('/my', ensureAuthenticated, async (req, res) => {
  try {
    const membershipDAO = new MembershipDAO();
    const payments = await membershipDAO.getPaymentsByUser(req.user.id);
    res.json(payments);
  } catch (err) {
    console.error('Error fetching user payments:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// PUT /api/payments/:paymentId/status - update payment status (admin only)
router.put('/:paymentId/status', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body;
    
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Stato di pagamento non valido.' });
    }
    
    const membershipDAO = new MembershipDAO();
    const updated = await membershipDAO.updatePaymentStatus(paymentId, status, notes || '');
    
    if (updated > 0) {
      res.json({ message: 'Stato del pagamento aggiornato con successo.' });
    } else {
      res.status(404).json({ error: 'Pagamento non trovato.' });
    }
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/payments/revenue/:year/:month - get monthly revenue (admin only)
router.get('/revenue/:year/:month', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Anno e mese sono obbligatori.' });
    }
    
    const membershipDAO = new MembershipDAO();
    const revenue = await membershipDAO.getMonthlyRevenue(parseInt(year), parseInt(month));
    res.json(revenue);
  } catch (err) {
    console.error('Error fetching revenue:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/payments/revenue - get current month revenue (admin only)
router.get('/revenue', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const membershipDAO = new MembershipDAO();
    const revenue = await membershipDAO.getMonthlyRevenue(year, month);
    res.json(revenue);
  } catch (err) {
    console.error('Error fetching current revenue:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// POST /api/payments - create new payment (admin only)
router.post('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { userId, membershipId, amount, paymentMethod, status, notes } = req.body;
    
    if (!userId || !membershipId || !amount || !paymentMethod || !status) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori.' });
    }
    
    if (!['cash', 'card', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Metodo di pagamento non valido.' });
    }
    
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Stato di pagamento non valido.' });
    }
    
    const dueDate = new Date().toISOString().split('T')[0];
    const membershipDAO = new MembershipDAO();
    const paymentId = await membershipDAO.createPayment(userId, membershipId, amount, paymentMethod, dueDate, notes || '');
    
    res.status(201).json({ id: paymentId, message: 'Pagamento creato con successo.' });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

module.exports = router;
