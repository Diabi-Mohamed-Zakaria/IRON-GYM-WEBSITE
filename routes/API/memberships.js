'use strict';

const express = require('express');
const { ensureAuthenticated } = require('../../routes/auth');
const MembershipDAO = require('../../models/membership-dao');

const router = express.Router();

// GET /api/memberships/me - current user membership
router.get('/me', ensureAuthenticated, async (req, res) => {
  try {
    const membershipDAO = new MembershipDAO();
    const mem = await membershipDAO.getMembershipByUser(req.user.id);
    res.json(mem || null);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/memberships/plans - get available membership plans
router.get('/plans', (req, res) => {
  try {
    const membershipDAO = new MembershipDAO();
    const plans = membershipDAO.getMembershipPlans();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// GET /api/memberships/user/:userId - get membership for specific user (admin only or own)
router.get('/user/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own membership, admins can see all
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Accesso negato.' });
    }
    
    const membershipDAO = new MembershipDAO();
    const membership = await membershipDAO.getMembershipByUser(parseInt(userId));
    res.json(membership);
  } catch (err) {
    console.error('Error fetching membership:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

// POST /api/memberships - create/update membership
// body: { planType: 'basic'|'premium'|'elite', billingPeriod: 'monthly'|'annual', paymentMethod: 'cash'|'card' }
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { planType, billingPeriod, paymentMethod } = req.body || {};
    
    if (!['basic', 'premium', 'elite'].includes(planType)) {
      return res.status(400).json({ error: 'Tipo di piano non valido.' });
    }
    if (!['monthly', 'annual'].includes(billingPeriod)) {
      return res.status(400).json({ error: 'Periodo di fatturazione non valido.' });
    }
    if (!['cash', 'card', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Metodo di pagamento non valido.' });
    }


    const membershipDAO = new MembershipDAO();
    const updated = await membershipDAO.upsertMembership(req.user.id, planType, billingPeriod, paymentMethod);
    res.status(201).json(updated);
  } catch (err) {
    console.error('Membership creation error:', err);
    res.status(500).json({ error: 'Errore del server.' });
  }
});

module.exports = router;
