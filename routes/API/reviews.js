'use strict';

const express = require('express');
const router = express.Router();
const ReviewDAO = require('../../models/review-dao');
const { body, validationResult } = require('express-validator');

// Middleware per verificare autenticazione
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Validazione per creazione recensione
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
  body('review_type')
    .isIn(['gym', 'trainer'])
    .withMessage('Review type must be either gym or trainer')
];

// GET /api/reviews - Recupera tutte le recensioni
router.get('/', async (req, res) => {
  try {
    const reviewDAO = new ReviewDAO();
    const reviews = await reviewDAO.getAllReviews();
    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/gym - Recupera recensioni della palestra
router.get('/gym', async (req, res) => {
  try {
    const reviewDAO = new ReviewDAO();
    const reviews = await reviewDAO.getReviewsByType('gym');
    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching gym reviews:', err);
    res.status(500).json({ error: 'Failed to fetch gym reviews' });
  }
});

// GET /api/reviews/trainer/:id - Recupera recensioni per trainer specifico
router.get('/trainer/:id', async (req, res) => {
  const trainerId = parseInt(req.params.id);
  
  if (isNaN(trainerId)) {
    return res.status(400).json({ error: 'Invalid trainer ID' });
  }
  
  try {
    const reviewDAO = new ReviewDAO();
    const reviews = await reviewDAO.getReviewsByTrainer(trainerId);
    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching trainer reviews:', err);
    res.status(500).json({ error: 'Failed to fetch trainer reviews' });
  }
});

// GET /api/reviews/stats/gym - Recupera statistiche rating palestra
router.get('/stats/gym', async (req, res) => {
  try {
    const reviewDAO = new ReviewDAO();
    const stats = await reviewDAO.getAverageGymRating();
    res.json({ stats });
  } catch (err) {
    console.error('Error fetching gym stats:', err);
    res.status(500).json({ error: 'Failed to fetch gym stats' });
  }
});

// GET /api/reviews/stats/trainer/:id - Recupera statistiche rating trainer
router.get('/stats/trainer/:id', async (req, res) => {
  const trainerId = parseInt(req.params.id);
  
  if (isNaN(trainerId)) {
    return res.status(400).json({ error: 'Invalid trainer ID' });
  }
  
  try {
    const reviewDAO = new ReviewDAO();
    const stats = await reviewDAO.getAverageRatingByTrainer(trainerId);
    res.json({ stats });
  } catch (err) {
    console.error('Error fetching trainer stats:', err);
    res.status(500).json({ error: 'Failed to fetch trainer stats' });
  }
});

// POST /api/reviews - Crea nuova recensione
router.post('/', requireAuth, reviewValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  
  const { rating, title, comment, review_type, trainer_id } = req.body;
  
  try {
    const reviewDAO = new ReviewDAO();
    
    // Se è una recensione per trainer, verifica che non sia già stata fatta
    if (review_type === 'trainer' && trainer_id) {
      const hasReviewed = await reviewDAO.hasUserReviewedTrainer(req.user.id, trainer_id);
      
      if (hasReviewed) {
        return res.status(400).json({ error: 'You have already reviewed this trainer' });
      }
    }
    
    const reviewData = {
      user_id: req.user.id,
      trainer_id: review_type === 'trainer' ? trainer_id : null,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      review_type
    };
    
    const review = await reviewDAO.createReview(reviewData);
    
    res.status(201).json({ 
      message: 'Review created successfully', 
      review 
    });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// DELETE /api/reviews/:id - Elimina recensione
router.delete('/:id', requireAuth, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  
  if (isNaN(reviewId)) {
    return res.status(400).json({ error: 'Invalid review ID' });
  }
  
  try {
    const reviewDAO = new ReviewDAO();
    
    // Prima verifica che la recensione appartenga all'utente
    const reviews = await reviewDAO.getAllReviews();
    const review = reviews.find(r => r.id === reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }
    
    const result = await reviewDAO.deleteReview(reviewId);
    
    if (!result.deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;